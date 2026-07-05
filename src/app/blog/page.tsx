import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "Blog",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="wrap">
      <h1 className="page-title">Blog</h1>
      <p className="page-sub">Noticias, eventos y novedades de PixelPlay.</p>

      <div className="grid-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.id}`} className="news-card">
            {p.image ? (
              <div className="thumb" style={{ backgroundImage: `url(${p.image})` }} />
            ) : (
              <div className="thumb" />
            )}
            <div className="body">
              <div className="tag">{p.tag}</div>
              <h3>{p.title}</h3>
              <p style={{ fontSize: "0.68rem", color: "var(--muted)", margin: "0.35rem 0" }}>
                {p.excerpt}
              </p>
              <div className="meta">
                {p.dateLabel} · {p.readTime}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
