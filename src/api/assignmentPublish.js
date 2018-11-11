import ajax from '@/utils/request'

export const getList = data => ajax({
  url: `/ishare_api/road_update/info_package/packages/`,
  method: 'get',
  params: data
})

