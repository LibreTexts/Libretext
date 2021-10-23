# [Recommended] Use AWS Lambda to deploy the renderer instead

## Deploy Renderer to Kubernetes
1. Install `kubectl`, the [official Kubernetes client](https://kubernetes.io/docs/tasks/tools/install-kubectl/). Use the most recent version of kubectl to ensure you are within one minor version of your cluster's Kubernetes version.
2. Install `doctl`, the official [DigitalOcean command-line tool](https://github.com/digitalocean/doctl), or other cloud platform-specific command-line tool.
3. Install [helm](https://helm.sh/docs/intro/install/), the kubernetes package manager.
4. Use your cloud provider's CLI tool to authenticate kubectl to your cluster.
5. Install the [Kubernetes metric server using helm](https://artifacthub.io/packages/helm/bitnami/metrics-server) onto your cluster.
6. Modify the included `renderer.yml` and `Ingress.yml` files.
7. Set up a network Ingress by following this [DigitalOcean tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nginx-ingress-on-digitalocean-kubernetes-using-helm). You will use `renderer.yml` in place of `hello-kubernetes-first.yaml` and `Ingress.yml` in place of `hello-kubernetes-ingress.yml`  As part of this, you will need to set up DNS records towards your cluster or load-balancer.

### Set up application-dictated autoscaling
1. Install `prometheus` using helm into `prom` namespace and with the `prometheus` helm release name.
2. `kubectl apply -f service-monitor.yml -n prom`
3. Verify in prometheus:9090/targets that your application is sending its metrics. If you don't see it, you can user prometheus/service-discovery to ensure your labels are correct.
4. Download [kube-metrics-adapter](https://github.com/zalando-incubator/kube-metrics-adapter) and configure the `docs/helm/values.yaml` file.
5. helm install the `docs/helm` folder.
6. Once the service is initialized, you should be able to run `kubectl get --raw /apis/external.metrics.k8s.io/v1beta1` and receive the following output:
```
{"kind":"APIResourceList","apiVersion":"v1","groupVersion":"external.metrics.k8s.io/v1beta1","resources":[{"name":"min-pods","singularName":"","namespaced":true,"kind":"ExternalMetricValueList","verbs":["get"]}]}
```
7. You should also be able to see your metric working using `kubectl describe hpa wwrenderer`
