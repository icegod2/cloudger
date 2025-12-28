'use client';

import * as React from 'react';
import { ChevronRight, ChevronDown, Tag, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AddCategoryDialog } from './AddCategoryDialog';
import { EditItemDialog } from './EditItemDialog';
import { DeleteCategoryButton } from './DeleteCategoryButton';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  children?: Category[];
}

export function CategoryTree({ categories, type }: { categories: Category[], type: 'income' | 'expense' }) {
  const router = useRouter();

  // Build tree
  const buildTree = (list: Category[]) => {
    const map: any = {};
    const tree: Category[] = [];
    list.forEach(node => {
        map[node.id] = { ...node, children: [] };
    });
    list.forEach(node => {
        if (node.parentId) {
            if (map[node.parentId]) {
                map[node.parentId].children.push(map[node.id]);
            }
        } else {
            tree.push(map[node.id]);
        }
    });
    return tree;
  };

  const treeData = buildTree(categories);

  const CategoryNode = ({ node, depth = 0 }: { node: Category, depth?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div className="flex flex-col">
        <div className={cn(
          "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group",
          depth > 0 && "ml-6 border-l border-zinc-200 dark:border-zinc-800"
        )}>
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3 text-zinc-400" />
            <Link href={`/transactions?categoryId=${node.id}`} className="hover:underline">
                <span className="text-sm font-medium">{node.name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditItemDialog 
                id={node.id} 
                initialName={node.name} 
                type="category"
            />
            <AddCategoryDialog 
                type={type} 
                parentId={node.id}
                trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                        <Plus className="h-3 w-3" />
                    </Button>
                }
            />
            <DeleteCategoryButton id={node.id} name={node.name} />
          </div>
        </div>
        {hasChildren && (
          <div className="flex flex-col">
            {node.children!.map(child => <CategoryNode key={child.id} node={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {treeData.map(node => <CategoryNode key={node.id} node={node} />)}
      {treeData.length === 0 && <p className="text-sm text-zinc-400 p-4 text-center">No categories yet.</p>}
    </div>
  );
}
