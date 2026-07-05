import indexData from "@/data/posts/index.json";

export type PostMeta = {
  id: string;
  tag: string;
  title: string;
  date: string;
  dateLabel: string;
  readTime: string;
  excerpt: string;
  image?: string;
  author: string;
};

export type PostFull = PostMeta & {
  contentHtml: string;
};

export function getAllPosts(): PostMeta[] {
  const posts = indexData.posts as PostMeta[];
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostIds(): string[] {
  return getAllPosts().map((p) => p.id);
}

export async function getPostById(id: string): Promise<PostFull | null> {
  const meta = getAllPosts().find((p) => p.id === id);
  if (!meta) return null;
  try {
    const mod = await import(`@/data/posts/${id}.json`);
    return { ...meta, ...mod.default } as PostFull;
  } catch {
    return { ...meta, contentHtml: `<p>${meta.excerpt}</p>` };
  }
}
