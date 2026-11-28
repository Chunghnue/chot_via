import { ShopCatalogSchema, type ShopCatalog } from '@xin-via/shared';
import { baseApi, unwrap } from '../base';

/** Bảng giá và vật phẩm: `getShop` công khai (ẩn vật phẩm đã tắt), `adminShop` và `adminShopSave` dành cho admin. */
export const shopApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getShop: b.query({ query: (_arg: void) => '/shop', transformResponse: unwrap(ShopCatalogSchema), providesTags: ['Shop'] }),
    adminShop: b.query({ query: (_arg: void) => '/admin/shop', transformResponse: unwrap(ShopCatalogSchema), providesTags: ['Shop'] }),
    adminShopSave: b.mutation<ShopCatalog, ShopCatalog>({
      query: (body) => ({ url: '/admin/shop', method: 'PUT', body }),
      transformResponse: unwrap(ShopCatalogSchema),
      invalidatesTags: ['Shop'],
    }),
  }),
});

export const { useGetShopQuery, useAdminShopQuery, useAdminShopSaveMutation } = shopApi;
