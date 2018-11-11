import axios from 'axios'
import qs from 'qs'
import { Message } from 'element-ui'
// import store from '../store'
// import { getToken } from '@/utils/auth'

// 创建axios实例
const instince = axios.create({
  timeout: 20000,
  withCredentials: true
})

// request拦截器
const base = (args) => {
  if (args.method.toLocaleLowerCase() === 'post') {
    return instince({
      ...args,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify(args.data)
    })
  } else if (args.method.toLocaleLowerCase() === 'get') {
    return instince({
      ...args,
      params: qs.stringify(args.params)
    })
  }
  return instince(args)
}

// response 拦截器
export default args => base(args)
  .then((result) => {
    if (!window.Promise) {
      window.Promise = Promise
    }

    if (result.status !== 200) {
      return Promise.resolve({
        error: '未知错误'
      })
    }
    if (result.data.status !== 'ok') {
      if (!args.noError) {
        Message.error('未知错误')
      }
      return Promise.resolve({
        error: result.data.status
      })
    }
    return result.data
  }, () => {
    if (!args.noError) {
      Message.error('未知错误')
    }
    return Promise.resolve({
      error: '未知错误'
    })
  })
