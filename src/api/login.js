import ajax from '@/utils/request'

export const logoOut = data => ajax({
  url: `/ishare_manage_platform/api/v1.0/logout/`,
  method: 'get',
  params: data
})

export const getUserType = data => ajax({
  url: `/ishare_manage_platform/api/v1.0/login/`,
  method: 'get',
  params: data
})
