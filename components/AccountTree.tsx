'use client';

import * as React from 'react';
import { Wallet, Building2, CreditCard, ChevronRight, ChevronDown, TrendingUp, TrendingDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteAccountButton } from './DeleteAccountButton';
import { DeleteCategoryButton } from './DeleteCategoryButton';
import { EditItemDialog } from './EditItemDialog';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';

interface AccountNodeProps {
  id: number;
  name: string;
  type: string;
  balance: number;
  totalBalance?: number;
  children: AccountNodeProps[];
}

interface AccountTreeProps {
  nodes: AccountNodeProps[];
  itemType?: 'account' | 'category';
  showBalances?: boolean;
}

export function AccountTree({ nodes: initialNodes, itemType = 'account', showBalances = true }: AccountTreeProps) {
  const [nodes, setNodes] = React.useState(initialNodes);
  const router = useRouter();

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
        // Find which list contains these items
        const findParentList = (list: AccountNodeProps[]): AccountNodeProps[] | null => {
            if (list.find(n => n.id === active.id)) return list;
            for (const item of list) {
                if (item.children && item.children.length > 0) {
                    const found = findParentList(item.children);
                    if (found) return found;
                }
            }
            return null;
        };

        // We need to operate on a clone to avoid mutating state directly during search? 
        // Actually, we need to find the specific array reference in the state structure.
        // A simpler way is to write a recursive reducer or mapper.
        
        let newNodes = [...nodes];
        let reorderedList: AccountNodeProps[] | null = null;
        
        // Helper to find and update the specific list
        const updateRecursive = (list: AccountNodeProps[]): AccountNodeProps[] => {
            const activeIndex = list.findIndex(n => n.id === active.id);
            const overIndex = list.findIndex(n => n.id === over.id);

            if (activeIndex !== -1 && overIndex !== -1) {
                // Found them in the same list!
                reorderedList = arrayMove(list, activeIndex, overIndex);
                return reorderedList;
            }

            // Otherwise, look deeper
            return list.map(node => {
                if (node.children && node.children.length > 0) {
                    return { ...node, children: updateRecursive(node.children) };
                }
                return node;
            });
        };

        newNodes = updateRecursive(newNodes);

        if (reorderedList) {
            setNodes(newNodes); // Optimistic update
            
            // Call API
            try {
                const updates = (reorderedList as AccountNodeProps[]).map((node, index) => ({
                    id: node.id,
                    order: index
                }));
                
                const endpoint = itemType === 'account' ? '/api/accounts/reorder' : '/api/categories/reorder';
                await fetch(endpoint, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates })
                });
                
                // Trigger global refresh to update sidebar
                window.dispatchEvent(new Event('vibe-data-change'));
            } catch (error) {
                console.error('Failed to reorder', error);
                setNodes(initialNodes); // Revert
            }
        }
    }
  };

  if (nodes.length === 0) {
      return null;
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        <SortableContext 
            items={nodes.map(n => n.id)} 
            strategy={verticalListSortingStrategy}
        >
            {nodes.map(node => (
                <SortableAccountTreeNode 
                    key={node.id} 
                    node={node} 
                    itemType={itemType} 
                    showBalances={showBalances} 
                />
            ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

function SortableAccountTreeNode(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.node.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as 'relative', // TypeScript fix
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <AccountTreeNode {...props} dragListeners={listeners} />
        </div>
    );
}

function AccountTreeNode({ 
    node, 
    depth = 0, 
    itemType,
    showBalances,
    dragListeners
}: { 
    node: AccountNodeProps, 
    depth?: number, 
    itemType: 'account' | 'category',
    showBalances: boolean,
    dragListeners?: any
}) {
  const [isOpen, setIsOpen] = React.useState(true); // Default to open
  const hasChildren = node.children && node.children.length > 0;
  const balance = node.totalBalance ?? node.balance;

  const getIcon = (name: string, type: string) => {
    if (itemType === 'category') {
        if (type === 'income') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        return <TrendingDown className="w-4 h-4 text-rose-500" />;
    }
    const lowerName = name.toLowerCase();
    if (type === 'liability' || lowerName.includes('credit')) return <CreditCard className="w-4 h-4" />;
    if (lowerName.includes('bank')) return <Building2 className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  const linkHref = itemType === 'account' 
    ? `/transactions?accountId=${node.id}` 
    : `/transactions?categoryId=${node.id}`;

  return (
    <div className="flex flex-col">
      <div className={cn(
        "flex items-center justify-between py-3 px-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700",
        depth > 0 && "ml-6 mt-1 bg-zinc-50/50 dark:bg-zinc-900/30"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 p-1" {...dragListeners}>
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Toggle Button */}
            <div className="w-6 flex items-center justify-center flex-shrink-0">
                {hasChildren ? (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsOpen(!isOpen);
                        }}
                    >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                ) : (
                    <div className="w-6" /> // Spacer
                )}
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm text-zinc-500 border border-zinc-100 dark:border-zinc-700 flex-shrink-0">
                {getIcon(node.name, node.type)}
            </div>
            
            <div className="overflow-hidden min-w-0">
                <Link href={linkHref} className="hover:underline truncate block">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{node.name}</p>
                </Link>
                {depth > 0 && (
                    <p className="text-[10px] text-zinc-400 uppercase tracking-tighter font-bold truncate">
                        {itemType === 'category' ? 'Sub-category' : 'Sub-account'}
                    </p>
                )}
            </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">
          {showBalances && (
            <div className="text-right">
                <p className={cn(
                    "text-lg font-bold tabular-nums",
                    itemType === 'category' 
                        ? "text-zinc-600 dark:text-zinc-400" // Categories just show total
                        : balance < 0 ? "text-rose-600" : "text-zinc-900 dark:text-zinc-50"
                )}>
                    ${Math.abs(balance).toLocaleString()}
                </p>
            </div>
          )}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <EditItemDialog 
                id={node.id} 
                initialName={node.name} 
                type={itemType}
            />
            {itemType === 'account' ? (
                <DeleteAccountButton id={node.id} name={node.name} />
            ) : (
                <DeleteCategoryButton id={node.id} name={node.name} />
            )}
          </div>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isOpen && (
        <div className="flex flex-col pl-4">
             <SortableContext 
                items={node.children.map(n => n.id)} 
                strategy={verticalListSortingStrategy}
            >
                {node.children.map((child) => (
                    <SortableAccountTreeNode 
                        key={child.id} 
                        node={child} 
                        depth={depth + 1} 
                        itemType={itemType} 
                        showBalances={showBalances}
                    />
                ))}
            </SortableContext>
        </div>
      )}
    </div>
  );
}