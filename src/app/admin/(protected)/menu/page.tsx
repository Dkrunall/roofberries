import { getMenuSections } from '@/lib/data/menu';
import { requireManagerOrRedirect } from '@/lib/actions/requireManager';
import { CategoryCard } from '@/components/admin/CategoryCard';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default async function AdminMenuPage() {
  await requireManagerOrRedirect();
  const sections = await getMenuSections();
  const totalItems = sections.reduce(
    (n, s) => n + s.categories.reduce((m, c) => m + c.items.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">Menu Items</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {sections.reduce((n, s) => n + s.categories.length, 0)} categories · {totalItems} items
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121215] p-4 sm:p-5 shadow-xl">
        <h2 className="mb-3 text-xs font-bold tracking-wider text-zinc-400 uppercase">Create New Category</h2>
        <CategoryForm />
      </div>

      {sections.map((section) => (
        <div key={section.section} className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">{section.section}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {section.categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                categoryId={cat.id}
                name={cat.name}
                itemCount={cat.items.length}
                imageUrl={cat.imageUrl}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
