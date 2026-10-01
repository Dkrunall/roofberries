import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryById } from '@/lib/data/menu';
import { requireManagerOrRedirect } from '@/lib/actions/requireManager';
import { MenuItemAdminRow } from '@/components/admin/MenuItemAdminRow';
import { AddItemPanel } from '@/components/admin/AddItemPanel';
import { EditCategoryPanel } from '@/components/admin/EditCategoryPanel';

export default async function AdminCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  await requireManagerOrRedirect();
  const { categoryId } = await params;
  const category = await getCategoryById(categoryId);
  if (!category) notFound();

  const nextSortOrder = category.items.length > 0 ? Math.max(...category.items.map((i) => i.sortOrder)) + 1 : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/menu"
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
      >
        <span>←</span>
        <span>Back to All Categories</span>
      </Link>

      <EditCategoryPanel
        categoryId={category.id}
        initial={{
          name: category.name,
          section: category.section,
          sortOrder: category.sortOrder,
          imageUrl: category.imageUrl ?? '',
        }}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Items in this Category</h2>
          <span className="text-xs font-semibold text-zinc-500">{category.items.length} items</span>
        </div>

        {category.items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center">
            <p className="text-sm font-medium text-zinc-400">No items in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {category.items.map((item) => <MenuItemAdminRow key={item.id} item={item} categoryId={category.id} />)}
          </div>
        )}
      </div>

      <AddItemPanel categoryId={category.id} nextSortOrder={nextSortOrder} />
    </div>
  );
}
