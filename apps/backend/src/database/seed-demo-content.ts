import { eq, sql } from 'drizzle-orm';
import type { MemberRole, MetricType, PostType } from '@xin-via/shared';
import { createDb } from './database';
import { vnWeekStart } from '@xin-via/shared';
import { achievements, challenges, comments, events, hotTopics, missions, notifications, places, pollVotes, postMedia, posts, users, wishEvents } from './schema';

const { db, close } = createDb();
const HOUR = 3_600_000;

interface DemoUser { name: string; role: MemberRole | null; job: string | null; province: string; avatar: string | null }
interface DemoPost {
  author: string; type: PostType; metric: MetricType | null; body: string; hashtags: string[]; image: { url: string; w: number; h: number } | null;
  hoursAgo: number; pinned?: boolean; reactions: number; comments: number; shares: number; poll?: string[];
}

/** Dữ liệu minh họa để trang chủ / Kể khổ có nội dung ngay. Số tiền khoe mặc định ẩn; người dùng thật đăng bài sẽ thay thế dần. */
const USERS: DemoUser[] = [
  { name: 'Lan Anh', role: 'owner', job: 'Chủ quán Café', province: 'Hà Nội', avatar: '/images/av-01.webp' },
  { name: 'Tuấn Anh', role: 'owner', job: 'Chủ quán Cafe', province: 'HCM', avatar: '/images/av-06.webp' },
  { name: 'Đặng Văn Nam', role: 'sale', job: 'Sale', province: 'Đà Nẵng', avatar: '/images/av-08.webp' },
  { name: 'Thu Hương', role: 'owner', job: 'Chủ cửa hàng thời trang', province: 'Hà Nội', avatar: '/images/av-02.webp' },
  { name: 'Lan Sale', role: 'sale', job: 'Sale', province: 'Hà Nội', avatar: '/images/av-05.webp' },
  { name: 'Quán Cà Phê Xinh', role: 'owner', job: 'Chủ quán', province: 'HCM', avatar: '/images/av-03.webp' },
  { name: 'Mr. Đức', role: 'sale', job: 'Sale', province: 'Hà Nội', avatar: '/images/av-09.webp' },
  { name: 'Nhà Hàng Sông Xanh', role: 'owner', job: 'Chủ quán', province: 'Cần Thơ', avatar: '/images/av-04.webp' },
  { name: 'Đức Hoàng', role: 'sale', job: 'Sale', province: 'Hà Nội', avatar: '/images/av-07.webp' },
  { name: 'Tiến Nguyễn', role: 'owner', job: 'Chủ cửa hàng', province: 'Đà Nẵng', avatar: '/images/av-10.webp' },
  { name: 'Xin Vía', role: null, job: null, province: 'Hà Nội', avatar: '/images/logo-than-tai.webp' },
];

const POSTS: DemoPost[] = [
  { author: 'Lan Anh', type: 'story', metric: null, body: 'Chạy KPI cuối năm mà khách cứ hỏi giá, haizzz… Xin vía chốt đơn ạ! 🙏', hashtags: ['kekho'], image: { url: '/images/bai-ke-kho.webp', w: 1000, h: 750 }, pinned: true, hoursAgo: 2.05, reactions: 326, comments: 89, shares: 0 },
  { author: 'Tuấn Anh', type: 'achievement', metric: 'revenue', body: 'Hôm nay quán cafe đạt 15.8 triệu! Cảm ơn cộng đồng Xin Vía 🙏', hashtags: ['doanhthu'], image: { url: '/images/bai-khoe-doanh-thu.webp', w: 1000, h: 750 }, pinned: true, hoursAgo: 3.05, reactions: 512, comments: 120, shares: 0 },
  { author: 'Đặng Văn Nam', type: 'achievement', metric: 'deal', body: 'Chốt deal 800 triệu cho chuỗi 5 cửa hàng F&B. Xin vía cho tháng sau nhé! 🔥', hashtags: ['khoedeal'], image: { url: '/images/bai-khoe-deal.webp', w: 1000, h: 750 }, pinned: true, hoursAgo: 4.05, reactions: 420, comments: 78, shares: 0 },
  { author: 'Thu Hương', type: 'story', metric: null, body: 'Hàng về nhiều mà khách chưa tới, xin vía đông khách cuối tuần! 💚', hashtags: ['kekho'], image: { url: '/images/hp-dong-cua.webp', w: 1000, h: 750 }, pinned: true, hoursAgo: 5.05, reactions: 298, comments: 65, shares: 0 },
  { author: 'Lan Sale', type: 'story', metric: null, body: 'Khách xem 3 lần, hỏi giá 5 lần, cuối cùng "để em suy nghĩ"… chắc lại mất khách rồi 😭', hashtags: ['kekho'], image: { url: '/images/kk-de-em-suy-nghi.webp', w: 1000, h: 750 }, hoursAgo: 2.4, reactions: 248, comments: 86, shares: 107 },
  { author: 'Quán Cà Phê Xinh', type: 'story', metric: null, body: 'Ngày đẹp trời mà khách vẫn thưa thớt.\nXin vía đông khách nha cả nhà 🙏🙏🙏', hashtags: ['kekho'], image: { url: '/images/hp-coffee.webp', w: 1000, h: 750 }, hoursAgo: 3.4, reactions: 320, comments: 72, shares: 93 },
  { author: 'Mr. Đức', type: 'story', metric: null, body: 'Chạy 100 cuộc gọi, chốt được 1 deal…\nThôi cũng vui rồi 😅', hashtags: ['kekho'], image: { url: '/images/kk-chuyen-ban-hang.webp', w: 1000, h: 750 }, hoursAgo: 4.4, reactions: 176, comments: 45, shares: 158 },
  { author: 'Nhà Hàng Sông Xanh', type: 'story', metric: null, body: 'Cuối tuần khách đông quá, cảm ơn cộng đồng\nđã luôn gửi vía ❤️', hashtags: ['kekho'], image: { url: '/images/hp-mo-cua.webp', w: 1000, h: 750 }, hoursAgo: 5.4, reactions: 289, comments: 67, shares: 106 },
  { author: 'Lan Anh', type: 'achievement', metric: 'revenue', body: 'Cuối tuần quán đông khách hơn mọi hôm, cảm ơn mọi người đã gửi vía! 🙏', hashtags: ['doanhthu'], image: { url: '/images/bai-khoe-doanh-thu.webp', w: 900, h: 675 }, hoursAgo: 40, reactions: 188, comments: 24, shares: 0 },
  { author: 'Lan Anh', type: 'achievement', metric: 'milestone', body: 'Quán tròn 1 năm tuổi, cảm ơn cộng đồng Xin Vía đã đồng hành ☕', hashtags: ['cotmoc'], image: { url: '/images/bia-quan-cafe.webp', w: 1400, h: 788 }, hoursAgo: 90, reactions: 240, comments: 31, shares: 0 },
  { author: 'Lan Sale', type: 'story', metric: null, body: 'Tuần này gọi 80 khách, 3 người bắt máy, 1 người cúp ngang 😅', hashtags: ['kekho'], image: null, hoursAgo: 72, reactions: 500, comments: 30, shares: 0 },
  { author: 'Lan Sale', type: 'story', metric: null, body: 'Báo giá xong khách im re, hôm sau hỏi lại "còn hàng không em?" 😂', hashtags: ['kekho'], image: null, hoursAgo: 120, reactions: 452, comments: 22, shares: 0 },
  { author: 'Đức Hoàng', type: 'story', metric: null, body: 'Hẹn khách 3 lần, lần nào cũng "để mai anh báo lại" 😭', hashtags: ['kekho'], image: null, hoursAgo: 70, reactions: 560, comments: 18, shares: 0 },
  { author: 'Đức Hoàng', type: 'story', metric: null, body: 'Cuối tháng chạy KPI mà tim đập như đua xe 🏎️', hashtags: ['kekho'], image: null, hoursAgo: 100, reactions: 420, comments: 12, shares: 0 },
  { author: 'Tiến Nguyễn', type: 'story', metric: null, body: 'Nhập hàng nhiều quá, kho đầy mà khách chưa thấy đâu 😮‍💨', hashtags: ['kekho'], image: { url: '/images/kk-dong-don.webp', w: 1000, h: 750 }, hoursAgo: 140, reactions: 720, comments: 25, shares: 0 },
  { author: 'Thu Hương', type: 'wish_share', metric: null, body: 'Xin vía đông khách cuối tuần cho cả nhà nhé! 🙏', hashtags: ['xinvia'], image: null, hoursAgo: 6, reactions: 210, comments: 18, shares: 4 },
  { author: 'Tiến Nguyễn', type: 'wish_share', metric: null, body: 'Sáng nay xin vía Thần Tài, mong hôm nay chốt đơn thật nhiều ✨', hashtags: ['xinvia'], image: null, hoursAgo: 9, reactions: 164, comments: 11, shares: 2 },
  { author: 'Xin Vía', type: 'story', metric: null, body: 'Bạn thấy tháng này bán hàng thế nào?', hashtags: ['binhchon'], image: null, hoursAgo: 30, reactions: 12, comments: 3, shares: 0, poll: ['Bán tốt, quá đỉnh! 🔥', 'Bình thường thôi 😐', 'Khó khăn quá 😟'] },
];

const TOPICS = [
  'Làm sale có nên nghỉ Tết sớm?', 'Kinh doanh mùa cuối năm', 'Khởi nghiệp với vốn nhỏ', 'Chạy KPI có nên bán mình?', 'Tips giữ khách mùa thấp điểm',
];
const VOTES: Record<number, number> = { 0: 6, 1: 5, 2: 3 };

const ids = new Map<string, string>();
for (const u of USERS) {
  const [found] = await db.select({ id: users.id }).from(users).where(eq(users.displayName, u.name)).limit(1);
  if (found) { ids.set(u.name, found.id); continue; }
  const [row] = await db.insert(users).values({ displayName: u.name, memberRole: u.role, jobTitle: u.job, province: u.province, avatarUrl: u.avatar, isDemo: true }).returning({ id: users.id });
  if (row) ids.set(u.name, row.id);
}

for (const demo of POSTS) {
  const authorId = ids.get(demo.author);
  if (!authorId) continue;
  const [dup] = await db.select({ id: posts.id }).from(posts).where(eq(posts.body, demo.body)).limit(1);
  if (dup) continue;
  const user = USERS.find((u) => u.name === demo.author);
  const [post] = await db.insert(posts).values({
    authorId, isDemo: true, type: demo.type, role: demo.type === 'achievement' ? (user?.role ?? null) : null, body: demo.body, location: user?.province ?? null, hashtags: demo.hashtags,
    reactionCount: demo.reactions, commentCount: demo.comments, shareCount: demo.shares,
    poll: demo.poll ? { options: demo.poll.map((text, i) => ({ id: `o${i}`, text })) } : null,
    pinnedAt: demo.pinned ? new Date() : null,
    createdAt: new Date(Date.now() - demo.hoursAgo * HOUR),
  }).returning({ id: posts.id });
  if (!post) continue;
  if (demo.metric) await db.insert(achievements).values({ postId: post.id, metricType: demo.metric, displayMode: 'hidden' });
  if (demo.image) await db.insert(postMedia).values({ postId: post.id, ownerId: authorId, url: demo.image.url, width: demo.image.w, height: demo.image.h });
  if (demo.poll) {
    let n = 0;
    for (const [option, count] of Object.entries(VOTES)) {
      for (let i = 0; i < count; i += 1) {
        n += 1;
        const [voter] = await db.insert(users).values({ displayName: `Người dùng mẫu ${String(n).padStart(2, '0')}`, isDemo: true }).returning({ id: users.id });
        if (voter) await db.insert(pollVotes).values({ postId: post.id, userId: voter.id, optionId: `o${option}` });
      }
    }
  }
}

// Điểm vía mẫu cho vài tài khoản có ảnh đại diện để mục "Cộng đồng Xin Vía" và tab Cộng đồng có người nổi bật (chỉ đặt khi tài khoản đó chưa có điểm).
const SAMPLE_POINTS: [string, number][] = [['Lan Anh', 98], ['Tuấn Anh', 91], ['Thu Hương', 84], ['Đặng Văn Nam', 77], ['Lan Sale', 70], ['Đức Hoàng', 63]];
for (const [name, points] of SAMPLE_POINTS) {
  const id = ids.get(name);
  if (id) await db.update(users).set({ points, pointsUpdatedAt: new Date() }).where(sql`${users.id} = ${id} and ${users.points} = 0 and ${users.isDemo} = true`);
}

/** Bình luận mẫu tự nhiên cho từng loại bài (nội dung khác nhau, không lặp máy móc). */
const COMMENT_POOLS: Record<'story' | 'achievement' | 'wish_share', string[]> = {
  story: [
    'Trời ơi đúng cảnh nhà em luôn, đọc mà thấy mình trong đó 😭', 'Cố lên chị ơi, tháng sau khách sẽ về nườm nượp thôi!', 'Gửi vía đông khách cho bạn nè 🙏', 'Nghề này ai chưa khóc vì khách "để em suy nghĩ" thì chưa phải sale thật sự 😂',
    'Em cũng vừa gặp y chang hôm qua, thôi coi như luyện tâm vậy anh ơi.', 'Giữ vững tinh thần nha, vía lành sắp tới rồi.', 'Đọc xong thấy được an ủi ghê, cảm ơn bạn đã chia sẻ.', 'Mình bán hàng 5 năm rồi, cứ kiên nhẫn là có khách thôi bạn.',
    'Chốt được đơn đầu tiên là cả ngày vui luôn, chúc bạn sớm có đơn!', 'Ôi thương quá, ôm một cái ❤️', 'Hôm nay Thần Tài cho vía rồi, chắc chắn chiều nay có đơn.', 'Bạn thử đổi cách chào khách xem, bên mình đổi xong tỉ lệ chốt tăng hẳn.',
    'Cùng cảnh ngộ nè, mình xin vía chung nhé 🍀', 'Khổ trước sướng sau, cố lên!', 'Hay quá, kể thêm đi bạn ơi, nghe mà vừa buồn cười vừa thương.', 'Thôi kệ, ngày mai là một ngày mới, nhiều khách hơn.', 'Sale thì ai chẳng có ngày như vậy, mai lại ổn thôi.',
    'Nể bạn thật, vẫn vui vẻ kể ra được.', 'Cho mình xin vía luôn với, tháng này cũng chưa có deal nào 😅', 'Xin vía đông khách cho cả nhà nha!',
  ],
  achievement: [
    'Chúc mừng bạn nhé, giỏi quá! 🎉', 'Quán đông vậy là nhờ bạn chăm chút rồi, chúc mừng!', 'Xin chút vía của bạn với, mai mình cũng muốn được như vậy 🙏', 'Đỉnh quá, chia sẻ bí quyết đi bạn ơi!',
    'Chúc mừng! Năng lượng tích cực lan tỏa tới cả nhóm luôn.', 'Mừng cho bạn thật sự, xứng đáng lắm.', 'Giữ phong độ nhé, tháng sau còn cao hơn nữa!', 'Gửi vía chốt thêm nhiều đơn nữa nha 💰',
    'Nhìn mà có thêm động lực, cảm ơn bạn đã khoe.', 'Quá tuyệt, mình cũng đang chạy KPI, nhờ bạn truyền lửa.', 'Chúc mừng cả team, vía lành luôn đi cùng bạn!', 'Thần Tài phù hộ, làm ăn phát đạt nhé ✨',
    'Cho mình hỏi bạn làm kênh nào mà hiệu quả vậy?', 'Vui lây luôn, chúc mừng bạn nhiều nhiều.', 'Cố gắng nhiều rồi mới có kết quả, chúc mừng!', 'Tuyệt vời, tháng này bạn là ngôi sao rồi.', 'Mừng ghê, hôm nay cả nhà ăn mừng thôi!',
    'Đúng là có công mài sắt có ngày nên kim.', 'Chúc bạn sức khỏe và buôn may bán đắt!', 'Like mạnh cho bạn, tiếp tục phát huy nhé!',
  ],
  wish_share: [
    'Xin vía cùng bạn, chúc cuối tuần đông khách 🙏', 'Thần Tài nghe thấy rồi, sắp có đơn thôi!', 'Mình cũng xin vía sáng nay luôn, chúc cả nhà chốt đơn mỏi tay.', 'Gửi bạn một chút vía may mắn nè 🍀',
    'Chúc bạn một ngày thật nhiều khách và nhiều niềm vui!', 'Vía lành đã về, chúc bạn buôn may bán đắt.', 'Cảm ơn bạn đã xin vía giúp cả nhóm nhé.', 'Nhờ bài này mà mình nhớ xin vía hôm nay, cảm ơn bạn!',
    'Chúc cả nhà hôm nay thuận lợi, đơn về như nước ✨', 'Cùng xin vía nào mọi người ơi!', 'Chốt đơn thuận lợi nha bạn.', 'Xin vía cho mình luôn với, hôm nay có buổi gặp khách quan trọng.',
    'Thần Tài ơi, phù hộ bạn ấy với 🙏', 'Chúc bạn gặp nhiều khách dễ tính.', 'Một ngày mới tràn đầy năng lượng nhé!', 'Mình thấy hôm nay khách đông hơn hẳn sau khi xin vía, tâm lý tốt cũng quan trọng.',
    'Vía của bạn lan tỏa tới mình rồi, cảm ơn!', 'Chúc mừng ngày mới, đơn hàng ùn ùn!', 'Gửi vía từ Đà Nẵng ra nhé!', 'Xin vía thành công, cùng cố gắng thôi!',
  ],
};
const commenterIds = USERS.filter((u) => u.role !== null).map((u) => ids.get(u.name)).filter((x): x is string => x !== undefined);
const demoPosts = await db.select({ id: posts.id, type: posts.type, authorId: posts.authorId, createdAt: posts.createdAt }).from(posts).where(eq(posts.isDemo, true)).orderBy(posts.createdAt);
for (const [i, post] of demoPosts.entries()) {
  const [has] = await db.select({ n: sql<number>`count(*)::int` }).from(comments).where(eq(comments.postId, post.id));
  if ((has?.n ?? 0) > 0) continue;
  const pool = COMMENT_POOLS[post.type];
  const people = commenterIds.filter((c) => c !== post.authorId);
  if (people.length === 0) continue;
  const k = 3 + ((i * 5 + 4) % 13);
  const rows = Array.from({ length: k }, (_, j) => {
    const body = pool[(i * 7 + j * 3) % pool.length] ?? pool[0] ?? '';
    return { postId: post.id, userId: people[(i + j) % people.length] ?? people[0] ?? '', body, createdAt: new Date(Math.min(Date.now() - 60_000, post.createdAt.getTime() + (j + 1) * 41 * 60_000)) };
  });
  await db.insert(comments).values(rows);
  await db.update(posts).set({ commentCount: k }).where(eq(posts.id, post.id));
}

/** Lượt gửi vía mẫu theo từng loại (6 loại) cho bài mẫu chưa có: số lượt khác nhau giữa các bài và các loại, tính cố định từ mã bài. Cập nhật tổng lượt của bài. */
await db.execute(sql`insert into wish_events (source, guest_hash, target_post_id, wish_type_id, created_at)
  select 'post', 'demo-seed', p.id, wt.id, p.created_at + random() * interval '2 days'
  from posts p cross join wish_types wt
  cross join lateral generate_series(1, (get_byte(decode(md5(p.id::text || wt.code), 'hex'), 0) % 16)) g
  where p.is_demo and wt.active
    and not exists (select 1 from wish_events e where e.source = 'post' and e.target_post_id = p.id and e.guest_hash = 'demo-seed')`);
await db.execute(sql`update posts set wish_count = (select count(*)::int from wish_events e where e.source = 'post' and e.target_post_id = posts.id) where is_demo`);

/**
 * Bốn bài Kể khổ đầu của thiết kế (đăng cách nhau 1 giờ) phải giữ đúng thứ tự "Đang được quan tâm". Bình luận và lượt vía mẫu giờ lấy từ dữ liệu thật nên khác nhau giữa các bài;
 * chỉnh lượt chia sẻ mẫu của bốn bài này để điểm tương tác gốc ngang nhau, khi đó bài mới hơn xếp trước (điểm giảm dần theo thời gian).
 */
const HOT_BASE_SCORE = 800;
for (const demo of POSTS.filter((p) => p.type === 'story' && !p.pinned && p.hoursAgo < 6)) {
  const [row] = await db.select({ id: posts.id, reactions: posts.reactionCount, comments: posts.commentCount, wishes: posts.wishCount }).from(posts).where(eq(posts.body, demo.body)).limit(1);
  if (!row) continue;
  const shares = Math.max(0, Math.round((HOT_BASE_SCORE - row.reactions - row.comments * 2 - row.wishes * 1.5) / 3));
  await db.update(posts).set({ shareCount: shares }).where(eq(posts.id, row.id));
}

const [anyTopic] = await db.select({ id: hotTopics.id }).from(hotTopics).limit(1);
if (!anyTopic) await db.insert(hotTopics).values(TOPICS.map((title, i) => ({ title, hashtag: null, sortOrder: i })));

/** Cửa hàng/văn phòng mẫu: chủ sở hữu (tài khoản mẫu), ảnh bìa, số liệu và số vía nhận trong tuần để bảng xếp hạng có dữ liệu. */
interface DemoPlace { slug: string; title: string; owner: string; cover: string; province: string; total: number; likes: number; follows: number; week: number }
const PLACES: DemoPlace[] = [
  { slug: 'quan-cafe-an-nhien', title: 'Quán Cafe An Nhiên', owner: 'Lan Anh', cover: '/images/bia-quan-cafe.webp', province: 'Hà Nội', total: 12500, likes: 2300, follows: 3200, week: 12500 },
  { slug: 'shop-thoi-trang-tam-an', title: 'Shop Thời Trang Tâm An', owner: 'Thu Hương', cover: '/images/shop-thoi-trang.webp', province: 'Hà Nội', total: 11800, likes: 1900, follows: 2700, week: 11800 },
  { slug: 'van-phong-sale-chot-don', title: 'Team Sale Chốt Đơn', owner: 'Đặng Văn Nam', cover: '/images/shop-van-phong-sale.webp', province: 'Đà Nẵng', total: 10200, likes: 1500, follows: 2100, week: 10200 },
  { slug: 'nha-hang-pho-viet', title: 'Nhà Hàng Thành Đạt', owner: 'Nhà Hàng Sông Xanh', cover: '/images/shop-nha-hang.webp', province: 'Cần Thơ', total: 9600, likes: 1200, follows: 1800, week: 9600 },
  { slug: 'minimart-hong-phat', title: 'Minimart Hùng Cường', owner: 'Tiến Nguyễn', cover: '/images/shop-minimart.webp', province: 'Đà Nẵng', total: 8900, likes: 900, follows: 1500, week: 8900 },
  { slug: 'van-phong-sale-but-pha', title: 'Team Sale Bứt Phá', owner: 'Mr. Đức', cover: '/images/shop-van-phong-sale.webp', province: 'Hà Nội', total: 8100, likes: 800, follows: 1200, week: 8100 },
];
const weekStart = vnWeekStart(new Date());
for (const dp of PLACES) {
  const ownerId = ids.get(dp.owner);
  const [found] = await db.select({ id: places.id }).from(places).where(eq(places.slug, dp.slug)).limit(1);
  if (!found || !ownerId) continue;
  await db.update(places).set({ title: dp.title, ownerId, coverUrl: dp.cover, province: dp.province, wishCount: dp.total, likeCount: dp.likes, followCount: dp.follows, isDemo: true }).where(eq(places.id, found.id));
  const [has] = await db.select({ n: sql<number>`count(*)::int` }).from(wishEvents).where(sql`${wishEvents.targetPlaceId} = ${found.id} and ${wishEvents.guestHash} = 'demo-seed'`);
  if ((has?.n ?? 0) === 0) {
    await db.execute(sql`insert into wish_events (source, guest_hash, target_place_id, created_at)
      select 'place', 'demo-seed', ${found.id}, ${weekStart.toISOString()}::timestamptz + random() * (now() - ${weekStart.toISOString()}::timestamptz) from generate_series(1, ${dp.week})`);
  }
}

/** Nhiệm vụ, thử thách tuần và sự kiện mẫu theo thiết kế (không có điểm thưởng). */
await db.update(missions).set({ name: 'Đăng 1 bài chia sẻ', target: 1, rewardPoints: 50, sortOrder: 0 }).where(eq(missions.code, 'post_1'));
await db.update(missions).set({ name: 'Gửi vía cho 5 người', target: 5, rewardPoints: 50, sortOrder: 1 }).where(eq(missions.code, 'send_5'));
await db.update(missions).set({ name: 'Ghé 3 cửa hàng mới', target: 3, rewardPoints: 30, sortOrder: 2 }).where(eq(missions.code, 'visit_2'));
await db.update(missions).set({ active: false }).where(eq(missions.code, 'deity_3'));
const [ch] = await db.select({ id: challenges.id }).from(challenges).limit(1);
if (ch) await db.update(challenges).set({ name: 'Hoàn thành 3 nhiệm vụ để nhận quà hấp dẫn!', description: 'Đăng 1 bài chia sẻ, gửi vía cho 5 người, ghé 3 cửa hàng mới.', target: 3 }).where(eq(challenges.id, ch.id));
// Sự kiện mẫu (chèn theo tiêu đề nên chạy lặp không nhân đôi; thêm sự kiện mới vào đây là có ở mọi server khi chạy lại).
const DAY = 86_400_000;
const sampleEvents: { title: string; description: string; coverUrl: string; days: number; startOffset?: number }[] = [
  { title: 'Tuần lễ gửi vía cuối năm', description: 'Cùng cộng đồng gửi vía cho nhau, chốt đơn thật nhiều trước Tết!', coverUrl: '/images/bia-quan-cafe.webp', days: 30 },
  { title: 'Thử thách “Chốt Deal Tháng Vàng”', description: 'Chia sẻ deal, nhận quà lên đến 1.000.000đ', coverUrl: '/images/ic-gift.webp', days: 21, startOffset: -1 },
  { title: 'Kể khổ vui – xả stress cuối tuần', description: 'Kể chuyện bán hàng dở khóc dở cười, nhận thật nhiều cảm xúc từ mọi người.', coverUrl: '/images/kk-banner.webp', days: 14 },
];
for (const e of sampleEvents) {
  const [found] = await db.select({ id: events.id }).from(events).where(eq(events.title, e.title)).limit(1);
  if (!found) await db.insert(events).values({ title: e.title, description: e.description, coverUrl: e.coverUrl, startsAt: new Date(weekStart.getTime() + (e.startOffset ?? 0) * DAY), endsAt: new Date(weekStart.getTime() + e.days * DAY), active: true });
}

// Thông báo mẫu cho mọi tài khoản thật (không phải mẫu) chưa có thông báo nào, để chuông ở đầu trang có số chưa đọc (12) và trang Thông báo có nội dung.
const [anyPost] = await db.select({ id: posts.id }).from(posts).where(eq(posts.isDemo, true)).limit(1);
const [anyPlace] = await db.select({ title: places.title, slug: places.slug }).from(places).where(eq(places.isDemo, true)).limit(1);
const realUsers = await db.select({ id: users.id }).from(users).where(eq(users.isDemo, false));
if (anyPost && anyPlace) {
  const actors = ['Lan Anh', 'Tuấn Anh', 'Thu Hương', 'Đặng Văn Nam', 'Lan Sale', 'Đức Hoàng'];
  const wishNames = ['Đông khách', 'Nhiều đơn', 'Chốt deal', 'Đạt KPI', 'Buôn may bán đắt'];
  for (const u of realUsers) {
    const [has] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(eq(notifications.userId, u.id));
    if ((has?.n ?? 0) > 0) continue;
    const rows = Array.from({ length: 12 }, (_, i) => {
      const actorName = actors[i % actors.length] ?? 'Lan Anh';
      const base = { userId: u.id, createdAt: new Date(Date.now() - (i + 1) * 47 * 60_000) };
      if (i % 4 === 0) return { ...base, type: 'place_wished' as const, params: { placeTitle: anyPlace.title, placeSlug: anyPlace.slug, wishTypeName: wishNames[i % wishNames.length] ?? 'Đông khách', senderName: actorName } };
      if (i % 4 === 1) return { ...base, type: 'post_reacted' as const, params: { postId: anyPost.id, actorName } };
      if (i % 4 === 2) return { ...base, type: 'post_commented' as const, params: { postId: anyPost.id, actorName } };
      return { ...base, type: 'new_follower' as const, params: { userId: ids.get(actorName) ?? u.id, actorName } };
    });
    await db.insert(notifications).values(rows);
  }
}

console.log('Đã thêm dữ liệu mẫu cho trang chủ và Kể khổ.');
await close();
