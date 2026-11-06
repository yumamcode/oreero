const $ = (id) => document.getElementById(id);

const homeView = $("home-view");
const articleView = $("article-view");
const adminView = $("admin-view");

let posts = [];
let photos = [];

// HTMLに文字列を安全に表示するための処理
function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

// 記事一覧を読み込む
async function loadPosts() {
  const list = $("post-list");
  list.innerHTML = "<p>記事を読み込んでいます...</p>";

  try {
    const response = await fetch("posts/index.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("記事一覧を読み込めません");
    }

    const paths = await response.json();

    if (!Array.isArray(paths)) {
      throw new Error("posts/index.json の形式が正しくありません");
    }

    const results = await Promise.all(
      paths.map(async (path) => {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.json();
      }),
    );

    posts = results
      .filter(Boolean)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    renderPostList();
  } catch (error) {
    list.innerHTML =
      "<p>記事を読み込めませんでした。posts/index.jsonを確認してください。</p>";
    console.error(error);
  }
}

// 記事一覧を表示
function renderPostList() {
  const list = $("post-list");

  if (posts.length === 0) {
    list.innerHTML = "<p>まだ記事はありません。</p>";
    return;
  }

  list.innerHTML = posts
    .map((post) => {
      const images = Array.isArray(post.images) ? post.images : [];
      const firstImage = images[0]?.src || post.image || "";
      const imageHTML = firstImage
        ? `<img src="${escapeHTML(firstImage)}" alt="" loading="lazy">`
        : `<div class="empty-image">写真なし</div>`;

      return `
      <div class="post-card">
        <a href="#post/${encodeURIComponent(post.id)}">
          ${imageHTML}
          <div class="post-card-body">
            <div class="post-meta">
              ${escapeHTML(post.category || "日記")}
              ・${escapeHTML(post.date || "")}
            </div>
            <h3>${escapeHTML(post.title || "無題")}</h3>
            <p>${escapeHTML(post.description || post.excerpt || "")}</p>
          </div>
        </a>
      </div>
    `;
    })
    .join("");
}

// 記事詳細を表示
function renderArticle(id) {
  const post = posts.find((item) => String(item.id) === String(id));
  const content = $("article-content");

  if (!post) {
    content.innerHTML = "<p>記事が見つかりませんでした。</p>";
    return;
  }

  const images = Array.isArray(post.images) ? post.images : [];

  const imageHTML = images
    .map(
      (image) => `
    <figure class="article-photo">
      <img src="${escapeHTML(image.src)}"
           alt="${escapeHTML(image.caption || post.title || "")}"
           loading="lazy">
      ${
        image.caption
          ? `<figcaption>${escapeHTML(image.caption)}</figcaption>`
          : ""
      }
    </figure>
  `,
    )
    .join("");

  // 旧形式の記事にも対応
  const oldImageHTML =
    !images.length && post.image
      ? `<figure class="article-photo">
         <img src="${escapeHTML(post.image)}" alt="">
       </figure>`
      : "";

  content.innerHTML = `
    <div class="article">
      <div class="article-meta">
        ${escapeHTML(post.category || "日記")}
        ・${escapeHTML(post.date || "")}
      </div>
      <h1>${escapeHTML(post.title || "無題")}</h1>
      ${
        post.description
          ? `<p class="article-description">${escapeHTML(post.description)}</p>`
          : ""
      }
      <div class="article-body">${escapeHTML(post.body || "")}</div>
      ${imageHTML || oldImageHTML}
    </div>
  `;
}

// URLに応じて画面を切り替える
function showRoute() {
  const hash = location.hash || "#home";

  homeView.hidden = true;
  articleView.hidden = true;
  adminView.hidden = true;

  if (hash.startsWith("#post/")) {
    const id = decodeURIComponent(hash.slice(6));
    articleView.hidden = false;
    renderArticle(id);
  } else if (hash === "#admin") {
    adminView.hidden = false;
  } else {
    homeView.hidden = false;
  }
}

window.addEventListener("hashchange", showRoute);

$("back-home").addEventListener("click", () => {
  location.hash = "#home";
});

// 写真のプレビュー用URLを解放
function clearPhotoUrls() {
  photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
}

// 写真一覧を表示
function renderPhotos() {
  const list = $("photo-list");
  $("photo-count").textContent = `${photos.length} / 30枚`;

  list.innerHTML = photos
    .map(
      (photo, index) => `
    <div class="photo-item" data-index="${index}">
      <img src="${photo.previewUrl}" alt="">
      <div>
        <input
          type="text"
          class="caption-input"
          data-index="${index}"
          value="${escapeHTML(photo.caption)}"
          maxlength="150"
          placeholder="写真の説明（任意）">
        <div class="photo-controls">
          <button type="button" data-action="up" data-index="${index}"
            ${index === 0 ? "disabled" : ""}>↑ 上へ</button>
          <button type="button" data-action="down" data-index="${index}"
            ${index === photos.length - 1 ? "disabled" : ""}>↓ 下へ</button>
          <button type="button" data-action="remove" data-index="${index}">
            削除
          </button>
        </div>
        <small>${escapeHTML(photo.file.name)}</small>
      </div>
    </div>
  `,
    )
    .join("");
}

// 写真ファイルを追加
function addPhotos(fileList) {
  const files = Array.from(fileList || []);
  let added = 0;

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    if (file.size > 15 * 1024 * 1024) {
      alert(`${file.name} は15MBを超えているため追加できません。`);
      continue;
    }

    if (photos.length >= 30) {
      alert("写真は最大30枚までです。");
      break;
    }

    photos.push({
      file,
      caption: "",
      previewUrl: URL.createObjectURL(file),
    });

    added++;
  }

  renderPhotos();

  if (added > 0) {
    $("form-message").textContent = `${added}枚の写真を追加しました。`;
  }
}

// ファイル選択
$("photo-input").addEventListener("change", (event) => {
  addPhotos(event.target.files);
  event.target.value = "";
});

// ドラッグ＆ドロップ
const dropZone = $("drop-zone");

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  addPhotos(event.dataTransfer.files);
});

// 写真の説明文を保存
$("photo-list").addEventListener("input", (event) => {
  if (!event.target.classList.contains("caption-input")) return;

  const index = Number(event.target.dataset.index);
  if (photos[index]) {
    photos[index].caption = event.target.value;
  }
});

// 写真の順番変更・削除
$("photo-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === "remove") {
    URL.revokeObjectURL(photos[index].previewUrl);
    photos.splice(index, 1);
  }

  if (action === "up" && index > 0) {
    [photos[index - 1], photos[index]] = [photos[index], photos[index - 1]];
  }

  if (action === "down" && index < photos.length - 1) {
    [photos[index + 1], photos[index]] = [photos[index], photos[index + 1]];
  }

  renderPhotos();
});

// 記事データを作る
function collectArticle() {
  const id = String(Date.now());

  return {
    id,
    title: $("post-title").value.trim(),
    category: $("post-category").value.trim(),
    date: new Date().toISOString().slice(0, 10),
    description: $("post-description").value.trim(),
    body: $("post-body").value.trim(),
    images: photos.map((photo, index) => {
      const extension = getExtension(photo.file.name);
      const filename = `photo-${String(index + 1).padStart(2, "0")}.${extension}`;

      return {
        name: filename,
        src: `images/articles/post-${id}/${filename}`,
        caption: photo.caption.trim(),
      };
    }),
  };
}

function getExtension(filename) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match ? match[1] : "jpg";

  // URLやファイル名に使いやすい拡張子に限定
  return ["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(ext)
    ? ext
    : "jpg";
}

// プレビュー
$("preview-button").addEventListener("click", () => {
  const title = $("post-title").value.trim();

  if (!title) {
    alert("記事タイトルを入力してください。");
    return;
  }

  const previewImages = photos
    .map(
      (photo) => `
    <figure class="article-photo">
      <img src="${photo.previewUrl}" alt="">
      ${
        photo.caption
          ? `<figcaption>${escapeHTML(photo.caption)}</figcaption>`
          : ""
      }
    </figure>
  `,
    )
    .join("");

  $("preview-content").innerHTML = `
    <div class="article">
      <div class="article-meta">
        ${escapeHTML($("post-category").value)}
      </div>
      <h1>${escapeHTML(title)}</h1>
      <p class="article-description">
        ${escapeHTML($("post-description").value)}
      </p>
      <div class="article-body">
        ${escapeHTML($("post-body").value)}
      </div>
      ${previewImages}
    </div>
  `;

  $("preview-area").hidden = false;
  $("preview-area").scrollIntoView({ behavior: "smooth" });
});

// ZIPを作成してダウンロード
$("post-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = $("form-message");
  const title = $("post-title").value.trim();

  if (!title) {
    alert("記事タイトルを入力してください。");
    return;
  }

  if (typeof JSZip === "undefined") {
    message.textContent =
      "ZIP作成ライブラリを読み込めません。インターネット接続を確認してください。";
    return;
  }

  const submitButton = $("post-form").querySelector('button[type="submit"]');

  submitButton.disabled = true;
  message.textContent = "ZIPファイルを作成しています...";

  try {
    const article = collectArticle();

    // 現在の既存記事一覧を読み込む
    let oldPaths = [];

    try {
      const response = await fetch("posts/index.json", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) oldPaths = data;
      }
    } catch (error) {
      console.warn("既存記事一覧を読み込めませんでした。", error);
    }

    const postPath = `posts/post-${article.id}.json`;

    // 新しい記事を先頭に追加。重複パスは除外
    const manifest = [
      postPath,
      ...oldPaths.filter((path) => path !== postPath),
    ];

    const zip = new JSZip();

    zip.file(postPath, JSON.stringify(article, null, 2));
    zip.file("posts/index.json", JSON.stringify(manifest, null, 2));

    // 写真をZIPに追加
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index];
      const filename = article.images[index].name;
      const imagePath = `images/articles/post-${article.id}/${filename}`;

      zip.file(imagePath, photo.file);
    }

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 5 },
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blog-post-${article.id}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 30000);

    message.textContent =
      "ZIPをダウンロードしました。展開してGitHubにアップロードしてください。";
  } catch (error) {
    console.error(error);
    message.textContent =
      "ZIPの作成に失敗しました。写真や入力内容を確認してください。";
  } finally {
    submitButton.disabled = false;
  }
});

// 初期表示
loadPosts().then(showRoute);
