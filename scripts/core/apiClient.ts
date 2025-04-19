import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'

export class ApiClient {
  instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: 'https://iptv-org.github.io/api',
      responseType: 'stream'
    })
  }

  get(url: string, options: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.get(url, options)
  }
}
