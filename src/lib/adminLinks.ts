/** Заявка в адмінці — одразу знайдена й розгорнута (див. LeadList, параметр open) */
export const leadLink = (orderNo: number, id: string) => `/admin/zayavky?q=${orderNo}&open=${id}`;
