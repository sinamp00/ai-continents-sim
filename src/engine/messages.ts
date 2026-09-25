/**
 * Bilingual narrative templates for everything the engine writes to the
 * feed and timeline. `{var}` placeholders are interpolated with vars.
 */
import type { ContinentId } from './types';
import { cname, type Lang } from '../i18n';

type Vars = Record<string, string | number>;

const TPL: Record<string, { fa: string; en: string }> = {
  // ---- initial state ----
  'init.feed': {
    en: '🌍 The simulation begins. Seven civilizations awaken, each guided by its own AI mind.',
    fa: '🌍 شبیه‌سازی آغاز شد. هفت تمدن بیدار شدند، هر یک با ذهن هوش مصنوعی خود.',
  },
  'init.title': { en: 'The Awakening', fa: 'بیداری' },
  'init.desc': {
    en: 'Seven continent-civilizations emerge, each ruled by an autonomous AI agent.',
    fa: 'هفت تمدن قاره‌ای ظهور کردند، هر یک تحت فرمان یک ایجنت هوش مصنوعی مستقل.',
  },

  // ---- decisions ----
  thought: { en: '💭 {a}: "{r}"', fa: '💭 {a}: «{r}»' },
  trade: {
    en: '🤝 {a} × {b}: new trade deal signed. Both economies grow.',
    fa: '🤝 {a} × {b}: قرارداد تجاری جدید امضا شد. اقتصاد هر دو رشد می‌کند.',
  },
  tech: {
    en: '🔬 {a} shares technology with {b} (+{n} tech).',
    fa: '🔬 {a} تکنولوژی را با {b} به اشتراک گذاشت (+{n} تکنولوژی).',
  },
  'alliance.title': { en: 'Alliance formed', fa: 'تشکیل اتحاد' },
  'alliance.desc': {
    en: '{a} and {b} sign a formal military alliance.',
    fa: '{a} و {b} پیمان اتحاد نظامی رسمی امضا کردند.',
  },
  'war.title': { en: 'WAR declared', fa: 'اعلان جنگ' },
  'war.desc': {
    en: '{a} declares war on {b}! The world holds its breath.',
    fa: '{a} به {b} اعلان جنگ کرد! جهان نفسش را حبس کرد.',
  },
  'peace.title': { en: 'Peace treaty', fa: 'پیمان صلح' },
  'peace.desc': {
    en: '{a} and {b} sign a peace treaty. The war is over.',
    fa: '{a} و {b} پیمان صلح امضا کردند. جنگ تمام شد.',
  },
  treaty: {
    en: '📜 Treaty signed: "{t}" between {a} and {b}.',
    fa: '📜 معاهده امضا شد: «{t}» بین {a} و {b}.',
  },
  'treaty.title': { en: 'Treaty: {t}', fa: 'معاهده: {t}' },
  'gov.title': { en: 'Revolution in {a}', fa: 'انقلاب در {a}' },
  'gov.desc': {
    en: '{a} abandons {old} and adopts {new}.',
    fa: '{a} {old} را کنار گذاشت و {new} را پذیرفت.',
  },
  'org.title': { en: 'Organization founded', fa: 'تأسیس سازمان' },
  'org.desc': {
    en: '{a} founds "{n}" with {c} member(s).',
    fa: '{a} سازمان «{n}» را با {c} عضو تأسیس کرد.',
  },

  // ---- war resolution ----
  battle: {
    en: '⚔️ {a} × {b}: battle rages — {w} gains ground (−{n} combined strength).',
    fa: '⚔️ {a} × {b}: نبرد ادامه دارد — {w} پیشروی می‌کند (−{n} توان ترکیبی).',
  },
  'capitulate.title': { en: '{l} capitulates', fa: '{l} تسلیم شد' },
  'capitulate.desc': {
    en: '{l} surrenders to {w} and pays reparations. The war ends.',
    fa: '{l} در برابر {w} تسلیم شد و غرامت پرداخت می‌کند. جنگ پایان یافت.',
  },

  // ---- diplomatic incidents ----
  'inc.trade': {
    en: '📉 Trade dispute erupts between {a} and {b} over tariffs.',
    fa: '📉 اختلاف تجاری بر سر تعرفه‌ها بین {a} و {b} بالا گرفت.',
  },
  'inc.spy': {
    en: '🛰️ {a} accuses {b} of espionage — diplomats expelled.',
    fa: '🛰️ {a}، {b} را به جاسوسی متهم کرد — دیپلمات‌ها اخراج شدند.',
  },
  'inc.culture': {
    en: '🎭 A cultural festival celebrates {a}–{b} friendship.',
    fa: '🎭 جشنواره فرهنگی دوستی {a} و {b} برگزار شد.',
  },
  'inc.memo': {
    en: '🤝 {a} and {b} sign a minor cooperation memorandum.',
    fa: '🤝 {a} و {b} تفاهم‌نامه همکاری امضا کردند.',
  },
  'inc.border': {
    en: '⚠️ Border tensions flare between {a} and {b}.',
    fa: '⚠️ تنش مرزی بین {a} و {b} بالا گرفت.',
  },
  'inc.research': {
    en: '💡 Joint {a}–{b} research program announced to fanfare.',
    fa: '💡 برنامه تحقیقاتی مشترک {a} و {b} با استقبال اعلام شد.',
  },

  // ---- world events ----
  'ev.pandemic': {
    en: '🌊 Global pandemic strikes — economies falter, happiness plummets worldwide.',
    fa: '🌊 همه‌گیری جهانی ضربه زد — اقتصادها لرزیدند و شادی در سراسر جهان سقوط کرد.',
  },
  'ev.golden': {
    en: '📈 A global economic golden age lifts markets on every continent.',
    fa: '📈 عصر طلایی اقتصاد جهانی بازارهای همه قاره‌ها را بالا برد.',
  },
  'ev.volcano': {
    en: '🌋 A supervolcano erupts in {c} — skies darken, harvests fail.',
    fa: '🌋 ابرآتشفشانی در {c} فوران کرد — آسمان تیره شد و محصولات نابود شدند.',
  },
  'ev.breakthrough': {
    en: '🤖 Breakthrough in {c}! A leap in science ripples across the globe.',
    fa: '🤖 پیشرفت بزرگ در {c}! جهشی علمی در سراسر جهان طنین انداخت.',
  },
  'ev.peace': {
    en: '🕊️ A worldwide peace movement softens old rivalries.',
    fa: '🕊️ جنبش جهانی صلح رقابت‌های قدیمی را نرم کرد.',
  },
  'ev.resource': {
    en: '💥 Massive resource deposits discovered in {c}!',
    fa: '💥 ذخایر عظیم منابع در {c} کشف شد!',
  },
  'ev.climate': {
    en: '🌪️ Climate catastrophe: storms and floods batter every continent.',
    fa: '🌪️ فاجعه اقلیمی: طوفان و سیل همه قاره‌ها را درنوردید.',
  },
  'ev.longevity': {
    en: '🧬 A longevity revolution: populations grow healthier and happier.',
    fa: '🧬 انقلاب طول عمر: جمعیت‌ها سالم‌تر و شادتر شدند.',
  },
  'ev.cyber': {
    en: '🏴 A wave of cyberattacks disrupts economies across the globe.',
    fa: '🏴 موجی از حملات سایبری اقتصادهای جهان را مختل کرد.',
  },
  'ev.renaissance': {
    en: '🌟 A cultural renaissance sweeps the world — happiness soars.',
    fa: '🌟 رنسانس فرهنگی جهان را فرا گرفت — شادی اوج گرفت.',
  },

  // ---- local brain: public reasoning ----
  'reason.quiet': { en: 'The council chose a quiet year.', fa: 'شورا سال آرامی را برگزید.' },
  'reason.weighed': { en: 'The council weighed its options.', fa: 'شورا گزینه‌ها را سنجید.' },
  'reason.trade': {
    en: 'New trade routes with {o} will lift both economies.',
    fa: 'مسیرهای تجاری جدید با {o} اقتصاد هر دو را رونق می‌دهد.',
  },
  'reason.tech': {
    en: 'Sharing research with {o} to strengthen a friend.',
    fa: 'تحقیقاتمان را با {o} به اشتراک می‌گذاریم تا دوستی را تقویت کنیم.',
  },
  'reason.alliance': {
    en: 'A formal alliance with {o} secures our future.',
    fa: 'اتحاد رسمی با {o} آینده ما را تضمین می‌کند.',
  },
  'reason.war': {
    en: "{o}'s hostility can no longer go unanswered.",
    fa: 'خصومت {o} دیگر قابل تحمل نیست.',
  },
  'reason.peace': {
    en: 'Peace talks with {o} — the cost of war grows too high.',
    fa: 'مذاکرات صلح با {o} — هزینه جنگ بیش از حد بالا رفته است.',
  },
  'reason.treaty': {
    en: '{a} and {o} formalize cooperation.',
    fa: '{a} و {o} همکاری را رسمی می‌کنند.',
  },
  'reason.gov': {
    en: 'Reforms sweep {a}: a new {g} rises.',
    fa: 'اصلاحات {a} را فرا گرفت: {g} جدیدی برمی‌خیزد.',
  },
  'reason.org': {
    en: '{a} founds a new international body.',
    fa: '{a} نهاد بین‌المللی جدیدی تأسیس می‌کند.',
  },

  // ---- local brain: in-character statements ----
  'say.trade': {
    en: 'Trade winds favor the bold.|Markets open, partners welcome.|Commerce builds bridges.',
    fa: 'باد تجارت به نفع جسوران می‌وزد.|بازارها بازند، شرکا خوش آمدند.|تجارت پل می‌سازد.',
  },
  'say.alliance': {
    en: 'Together we are unbreakable.|A new pact for a new era.|Alone we are strong; together unstoppable.',
    fa: 'با هم شکست‌ناپذیریم.|پیمانی نو برای عصری نو.|تنها قوی‌ایم؛ با هم توقف‌ناپذیر.',
  },
  'say.war': {
    en: 'We did not choose this path — but we will walk it.|Our patience has limits.|History will remember this day.',
    fa: 'ما این راه را انتخاب نکردیم — اما تا انتها می‌رویم.|صبر ما هم حدی دارد.|تاریخ این روز را به خاطر خواهد سپرد.',
  },
  'say.peace': {
    en: 'The guns fall silent. Let rebuilding begin.|Peace is the bravest victory.|We choose tomorrow over vengeance.',
    fa: 'تفنگ‌ها خاموش شدند. بازسازی آغاز شود.|صلح شجاعانه‌ترین پیروزی است.|فردا را به انتقام ترجیح می‌دهیم.',
  },
  'say.tech_share': {
    en: 'Knowledge grows when shared.|Science knows no borders.|We gift progress to our friends.',
    fa: 'دانش وقتی به اشتراک گذاشته شود رشد می‌کند.|علم مرز نمی‌شناسد.|پیشرفت را به دوستانمان هدیه می‌دهیم.',
  },
  'say.treaty': {
    en: 'Signed in good faith.|A treaty for the ages.|Diplomacy triumphs again.',
    fa: 'با حسن نیت امضا شد.|معاهده‌ای برای اعصار.|دیپلماسی دوباره پیروز شد.',
  },
  'say.change_government': {
    en: 'A new chapter begins.|The people have spoken.|Reform is the price of survival.',
    fa: 'فصلی نو آغاز می‌شود.|مردم سخن گفتند.|اصلاح بهای بقاست.',
  },
  'say.found_organization': {
    en: 'A new institution rises.|Unity needs a home.|We build the future together.',
    fa: 'نهادی نو برمی‌خیزد.|وحدت به خانه نیاز دارد.|آینده را با هم می‌سازیم.',
  },
  'say.none': {
    en: 'We watch and wait.|Quiet years are wise years.|Patience is also a strategy.',
    fa: 'نظاره می‌کنیم و منتظر می‌مانیم.|سال‌های آرام سال‌های خردمندانه‌اند.|صبر هم یک استراتژی است.',
  },

  // ---- LLM fallbacks ----
  'llm.reason': {
    en: 'The council deliberated and chose its course.',
    fa: 'شورا مشورت کرد و مسیرش را برگزید.',
  },
  'llm.silence': { en: 'The council chose silence this year.', fa: 'شورا امسال سکوت را برگزید.' },
  'llm.watch': { en: '{a} watches the world turn.', fa: '{a} گردش جهان را نظاره می‌کند.' },

  // ---- Default treaty / organization names ----
  'treaty.default': { en: 'Pact of {a}–{b}', fa: 'پیمان {a}–{b}' },
  'org.default': { en: '{a} Concordat', fa: 'هم‌پیمانی {a}' },
};

export function m(lang: Lang, key: string, vars: Vars = {}): string {
  let s = TPL[key]?.[lang] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

/** Localized names of a list of continent ids, joined. */
export function names(ids: ContinentId[], lang: Lang, sep = ' × '): string {
  return ids.map((id) => cname(id, lang)).join(sep);
}

/** Pick one of the `|`-separated localized variants. */
export function pickSay(lang: Lang, key: string): string {
  const opts = (TPL[key]?.[lang] ?? '').split('|');
  return opts[Math.floor(Math.random() * opts.length)] || '';
}
