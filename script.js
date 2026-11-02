/* =================================
   ブログ記事データ
   新しい記事はここに追加します
================================= */

const posts = [
  {
    id: 1,
    title: "はじめてのブログ",
    date: "2026-11-02",
    category: "日記",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900",
    excerpt: "今日からブログを始めることにしました。",
    content: `
      <p>こんにちは。今日からこのブログを始めます。</p>
      <p>日々の出来事や、暮らしの中で見つけた小さな発見などを記録していきたいと思います。</p>
      <h2>ブログを始めた理由</h2>
      <p>自分の考えや経験を文章にして残しておきたいと思ったことがきっかけです。</p>
      <p>これから少しずつ記事を増やしていきます。よろしくお願いします。</p>
    `,
  },
  {
    id: 2,
    title: "快適なデスク環境を作る",
    date: "2026-11-01",
    category: "暮らし",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900",
    excerpt: "毎日使うデスクを使いやすく整理してみました。",
    content: `
      <p>毎日長い時間を過ごすデスク。少し整理するだけで作業が快適になります。</p>
      <h2>整理整頓のポイント</h2>
      <p>まずは机の上にある不要なものを片付けます。</p>
      <p>よく使うものだけを手の届く範囲に置くと便利です。</p>
      <h2>まとめ</h2>
      <p>快適な環境を作って、毎日の作業を楽しみましょう。</p>
    `,
  },
  {
    id: 3,
    title: "休日の過ごし方",
    date: "2026-10-30",
    category: "日記",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=900",
    excerpt: "ゆっくり過ごす休日の楽しみについて。",
    content: `
      <p>休日はいつもより少しゆっくり起きて、のんびり過ごすのが好きです。</p>
      <h2>自分の時間を大切にする</h2>
      <p>読書をしたり、散歩をしたり、好きなことをする時間を作っています。</p>
      <p>忙しい毎日の中で、こうした時間も大切にしたいですね。</p>
    `,
  },
];

/* =================================
   ブログの基本機能
================================= */

const postList = document.getElementById("postList");
const categories = document.getElementById("categories");
const searchInput = document.getElementById("searchInput");
const postCount = document.getElementById("postCount");
const emptyMessage = document.getElementById("emptyMessage");

const blogSection = document.getElementById("blog");
const articleSection = document.getElementById("articleSection");
const articleContent = document.getElementById("articleContent");

let selectedCategory = "すべて";

/* HTMLエスケープ */
function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}

/* 日付の表示 */
function formatDate(date) {
  const parts = date.split("-");
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/* =================================
   カテゴリ表示
================================= */

function renderCategories() {
  const categoryNames = [
    "すべて",
    ...new Set(posts.map((post) => post.category)),
  ];

  categories.innerHTML = categoryNames
    .map(
      (category) => `
    <button
      class="category-button ${selectedCategory === category ? "active" : ""}"
      data-category="${escapeHTML(category)}"
    >
      ${escapeHTML(category)}
    </button>
  `,
    )
    .join("");

  categories.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      renderCategories();
      renderPosts();
    });
  });
}

/* =================================
   記事一覧表示
================================= */

function renderPosts() {
  const keyword = searchInput.value.trim().toLowerCase();

  const filteredPosts = posts
    .filter((post) => {
      const matchesCategory =
        selectedCategory === "すべて" || post.category === selectedCategory;

      const matchesKeyword = [post.title, post.excerpt, post.category]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      return matchesCategory && matchesKeyword;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  postCount.textContent = `${filteredPosts.length} ARTICLES`;

  postList.innerHTML = filteredPosts
    .map(
      (post) => `
    <a class="post-card" href="#post/${post.id}">
      <img
        class="post-image"
        src="${escapeHTML(post.image)}"
        alt="${escapeHTML(post.title)}"
        loading="lazy"
      >
      <div class="post-info">
        <div class="post-meta">
          ${escapeHTML(formatDate(post.date))}
          <span class="post-category">
            ${escapeHTML(post.category)}
          </span>
        </div>
        <h3 class="post-title">${escapeHTML(post.title)}</h3>
        <p class="post-excerpt">${escapeHTML(post.excerpt)}</p>
      </div>
    </a>
  `,
    )
    .join("");

  emptyMessage.hidden = filteredPosts.length !== 0;
}

/* =================================
   記事詳細表示
================================= */

function showArticle(id) {
  const post = posts.find((item) => item.id === Number(id));

  if (!post) {
    location.hash = "#home";
    return;
  }

  blogSection.hidden = true;
  document.getElementById("about").hidden = true;
  articleSection.hidden = false;

  articleContent.innerHTML = `
    <div class="post-meta">
      ${escapeHTML(formatDate(post.date))}
      <span class="post-category">
        ${escapeHTML(post.category)}
      </span>
    </div>

    <h1 class="article-title">
      ${escapeHTML(post.title)}
    </h1>

    <img
      class="article-image"
      src="${escapeHTML(post.image)}"
      alt="${escapeHTML(post.title)}"
    >

    <div class="article-body">
      ${post.content}
    </div>
  `;

  window.scrollTo(0, 0);
}

/* =================================
   URLによる画面切り替え
================================= */

function handleRoute() {
  const match = location.hash.match(/^#post\/(\d+)$/);

  if (match) {
    showArticle(match[1]);
  } else {
    articleSection.hidden = true;
    blogSection.hidden = false;
    document.getElementById("about").hidden = false;
  }
}

/* =================================
   イベント設定
================================= */

searchInput.addEventListener("input", renderPosts);

document.getElementById("backButton").addEventListener("click", () => {
  location.hash = "#home";
});

document.getElementById("homeLogo").addEventListener("click", () => {
  location.hash = "#home";
});

window.addEventListener("hashchange", handleRoute);

/* =================================
   初期化
================================= */

document.getElementById("year").textContent = new Date().getFullYear();

renderCategories();
renderPosts();
handleRoute();
