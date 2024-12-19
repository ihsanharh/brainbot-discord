import os
import redis
import requests
import time

def load_proxy():
    with open('lnks/list.txt') as proxy_file:
        proxies = proxy_file.read().split('\n')

        if (len(proxies) < 1): return

        for proxy in proxies:
            if (len(proxy) >= 2): proxy = proxy.split(':', 1)
            if len(proxy) >= 2:
                redis_client.hset(name="proxy", key=proxy[0], value=proxy[1])

def fetch_proxy(url: str):
    res = requests.get(url.replace("hello", "_health"))
    print(res)
    return res

redis_host = os.environ["REDIS"].split(":")
redis_client = redis.Redis(host=redis_host[1].split("//")[1], port=redis_host[2], decode_responses=True)

load_proxy()

while True:
    for i in redis_client.hscan_iter(name="proxy"):
        proxy_url = i[1].split("$")[0]

        print(redis_client.hget(name="proxy", key=i[0]))
        fetch_proxy(proxy_url)
    time.sleep(90)