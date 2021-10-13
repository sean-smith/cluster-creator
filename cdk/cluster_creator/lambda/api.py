#!/usr/bin/env python3
import json
from base64 import b64decode, b64encode
from os import replace
from pprint import pprint
import boto3
import botocore
import requests

def sigv4_request(method, host, path, params, headers, body):
    "Adds authorization headers for sigv4 to headers parameter."
    endpoint = host.replace("https://", "").replace("http://", "")
    _api_id, _service, region, _domain = endpoint.split(".", maxsplit=3)

    request_parameters = "&".join([f"{k}={v}" for k, v in params.items()])
    url = f"{host}{path}?{request_parameters}"

    session = botocore.session.Session()
    body_data = json.dumps(body) if body else None
    request = botocore.awsrequest.AWSRequest(method=method, url=url, data=body_data)
    botocore.auth.SigV4Auth(session.get_credentials(), "execute-api", region).add_auth(request)
    boto_request = request.prepare()

    req_call = {
        "POST": requests.post,
        "GET": requests.get,
        "PUT": requests.put,
        "PATCH": requests.patch,
        "DELETE": requests.delete,
    }.get(method)

    for k, val in headers.items():
        boto_request.headers[k] = val

    return req_call(boto_request.url, data=body_data, headers=boto_request.headers, timeout=30)

def create(region, baseurl, cluster_name, config_file):
    path = "/v3/clusters"
    params = {"region": region}
    body = {"clusterConfiguration": config_file, "clusterName": cluster_name}
    headers = {"content-type": "application/json"}
    resp = sigv4_request("POST", baseurl, path, params, headers, body)
    pprint(resp.json())
    if 'cluster' in resp.json():
      stack_name = resp.json().get('cluster').get('cloudformationStackArn')
      return {'PhysicalResourceId': stack_name}
    else:
      raise Exception(resp.json())

def delete(region, baseurl, cluster_name):
    path = "/v3/clusters/{cluster_name}"
    params = {"region": region}
    resp = sigv4_request("GET", baseurl, path, params, {}, None)
    pprint(resp.json())

def list_clusters(region, baseurl):
    path = "/v3/clusters"
    params = {"region": region}
    resp = sigv4_request("GET", baseurl, path, params, {}, None)
    pprint(resp.json())

def substitute_vars(config, subnet_id, key_name):
    return config.format(key_name=key_name, subnet_id=subnet_id)

def on_event(event, context):
    pprint(event)
    region = event['ResourceProperties']['region']
    baseurl = event['ResourceProperties']['baseurl']
    cluster_name = event['ResourceProperties']['name']
    if event['RequestType'] in ['Create', 'Update']:
        config_template = b64decode(event['ResourceProperties']['config']).decode("ascii")
        subnet_id = event['ResourceProperties']['subnet_id']
        key_name = event['ResourceProperties']['key_name']
        config = substitute_vars(config_template, subnet_id=subnet_id, key_name=key_name)
        return create(region, baseurl, cluster_name, config)
    if event['RequestType'] == 'Delete':
        delete(region, baseurl, cluster_name)