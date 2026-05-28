import { EmbeddedReader } from "@/components/EmbeddedReader";

export default async function ReadArticle(props: PageProps<"/read/[title]">) {
  const { title } = await props.params;
  return <EmbeddedReader title={decodeURIComponent(title)} source="streak" />;
}
