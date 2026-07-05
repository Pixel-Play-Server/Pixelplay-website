import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById, getPostIds } from "@/lib/posts";

export async function generateStaticParams() {
  return getPostIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Noticia" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <main className="wrap">
      <Link href="/blog" className="back-link">
        ← Volver al blog
      </Link>

      <article className="panel">
        <div className="tag" style={{ fontSize: "0.62rem", color: "var(--green)", marginBottom: "0.5rem" }}>
          {post.tag}
        </div>
        <h1 className="page-title" style={{ marginBottom: "0.75rem" }}>
          {post.title}
        </h1>
        <div className="article-meta">
          <span>{post.dateLabel}</span>
          <span>{post.readTime}</span>
          <span>{post.author}</span>
        </div>
        {post.image && (
          <div
            className="article-hero"
            style={{ backgroundImage: `url(${post.image})` }}
          />
        )}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}
