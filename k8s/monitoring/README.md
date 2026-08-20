# Observability: Prometheus/Grafana + EFK

This directory adds monitoring and log aggregation to the `mjh` cluster:

- **Metrics:** Prometheus + Grafana via the `kube-prometheus-stack` Helm chart
  (cluster + app metrics, Alertmanager, built-in dashboards).
- **Logs:** EFK — Elasticsearch + Fluent Bit + Kibana (or CloudWatch Container
  Insights as a lighter alternative).
- **Uptime:** Route 53 health checks (see `k8s/README.md` §6 once the domain
  is wired up).

```text
k8s/monitoring/
├── README.md                              # this guide
├── kube-prometheus-stack-values.yaml      # Prometheus/Grafana Helm values
└── efk-values.yaml                        # EFK Helm values (optional)
```

## 1. Prometheus + Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f k8s/monitoring/kube-prometheus-stack-values.yaml

kubectl -n monitoring get pods -w
```

### Expose Grafana

```bash
# Port-forward for a quick look:
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
# open http://localhost:3000  (admin / prom-operator by default — change it!)
```

Or expose it properly with an Ingress later (same ALB pattern as `k8s/ingress.yaml`).

### Application metrics (optional)

To scrape backend app metrics, expose a Prometheus `/metrics` endpoint and
annotate the backend pods (PodMonitor). This is a roadmap item; the stack
already covers node/container/kubelet metrics out of the box.

## 2. Log aggregation with EFK

Install Elasticsearch, Fluent Bit, and Kibana:

```bash
helm repo add elastic https://helm.elastic.co
helm repo update

helm install elasticsearch elastic/elasticsearch \
  -n logging --create-namespace \
  -f k8s/monitoring/efk-values.yaml \
  --set clusterName=mjh-logs

helm install fluent-bit elastic/fluent-bit -n logging \
  --set elasticsearch.host=elasticsearch-master.logging.svc.cluster.local

helm install kibana elastic/kibana -n logging
```

### Kibana

```bash
kubectl -n logging port-forward svc/kibana-kibana 5601:5601
# open http://localhost:5601  → create the index pattern `fluent-bit-*`
```

Fluent Bit ships pod logs (stdout/stderr, JSON parsed) to Elasticsearch under
the `fluent-bit` index. The backend logs structured JSON (`logger.ts`), so
fields like `level`, `msg`, and `meta` are searchable.

## 3. Lighter alternative: CloudWatch Container Insights

If you prefer to skip running Elasticsearch in-cluster:

```bash
kubectl apply -f https://raw.githubusercontent.com/aws/containers-roadmap/master/eks/container-insights/cloudwatch-agent.yaml
kubectl apply -f https://raw.githubusercontent.com/aws/containers-roadmap/master/eks/container-insights/fluent-bit.yaml
```

Logs/metrics land in CloudWatch Logs under
`/aws/containerinsights/mjh-cluster/application`.

## 4. Alerting

`kube-prometheus-stack` ships Alertmanager. Default rules fire for pod
restarts, node pressure, and API availability. To route alerts to Slack/email,
edit the `alertmanager-config` secret in `monitoring` (see the
`kube-prometheus-stack` chart docs) — or keep it simple and start with the
default web UI at `http://<alertmanager>:9093`.
