import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponseTransformer
} from 'axios';

export default class HttpClient {
  // Here you can use your server URL
  //https://v59dq0jx2e.execute-api.us-east-1.amazonaws.com/Prod/api/get-client-token "https://ijbsrphg08.execute-api.us-east-1.amazonaws.com/Prod/api/"
  private static readonly baseURL: string = 'https://a54pbrbqr7.execute-api.us-east-1.amazonaws.com/Prod/';

  private static buildHeader(obj = {}): any
  // AxiosRequestHeaders 
  {
    const header = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    Object.assign(header, obj);

    return header;
  }

  private static transformResponse(
    input: string
  ): AxiosResponseTransformer | AxiosResponseTransformer[] {
    return JSON.parse(input);
  }

  private static client(header = {}): AxiosInstance {
    const config: AxiosRequestConfig = {
      baseURL: this.baseURL,
      headers: this.buildHeader(header),
    };
    config.transformResponse = [
      (data) => {
        return data && typeof data === 'string'
          ? this.transformResponse(data)
          : data;
      },
    ];

    return axios.create(config);
  }

  /**
   *
   * @param url
   * @returns
   */
  public static get(url: string): any {
    return this.client().get(url);
  }

  /**
   *
   * @param url
   * @param payload
   * @returns
   */
  public static post(url: string, payload: any): any {
    return this.client().post(url, payload);
  }
}