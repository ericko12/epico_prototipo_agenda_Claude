import { moduleSlugs } from "@/features/layoutMain/domain/data/menuItems.data";
import { ModulePlaceholder } from "./ModulePlaceholder";
import ParqueVehicularPage from "@/features/parqueVehicular/infrastructure/ui/ParqueVehicularPage";

const extra = [{ slug: "cajas", label: "Cajas", parent: "Pedidos" }];
const all = [...moduleSlugs, ...extra];

export function generateStaticParams() { return all.map((m) => ({ slug: m.slug })); }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "clientes" || slug === "parque-vehicular") return <ParqueVehicularPage />;
  const mod = all.find((m) => m.slug === slug) ?? { label: slug, parent: "Épico" };
  return <ModulePlaceholder label={mod.label} parent={mod.parent} />;
}
