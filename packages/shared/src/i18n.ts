import common from '../i18n/vi/common.json';
import nav from '../i18n/vi/nav.json';
import home from '../i18n/vi/home.json';
import wish from '../i18n/vi/wish.json';
import place from '../i18n/vi/place.json';
import street from '../i18n/vi/street.json';
import post from '../i18n/vi/post.json';
import auth from '../i18n/vi/auth.json';
import profile from '../i18n/vi/profile.json';
import community from '../i18n/vi/community.json';
import codes from '../i18n/vi/codes.json';
import validation from '../i18n/vi/validation.json';
import admin from '../i18n/vi/admin.json';
import shop from '../i18n/vi/shop.json';

/** Toàn bộ chữ hiển thị nằm ở packages/shared/i18n/vi/*.json — không viết cứng chữ trong code giao diện. */
export const viMessages = { common, nav, home, wish, place, street, post, auth, profile, community, codes, validation, admin, shop };
export type AppMessages = typeof viMessages;
export const DEFAULT_LOCALE = 'vi';
export const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';
