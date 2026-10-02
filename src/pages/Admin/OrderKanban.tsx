import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { formatPrice } from '../../utils/formatPrice';
import { Printer, Trash2, Truck, MapPin, Phone } from 'lucide-react';

interface OrderKanbanProps {
  orders: any[];
  updateOrderStatus: (id: number, status: string) => void;
  orderSearchTerm: string;
  onDeleteOrder: (id: number) => void;
  onPrintOrder: (id: number) => void;
  onSendToDelivery?: (id: number) => void;
}

const COLUMNS = [
  { id: 'nouvelle', title: 'En attente', dotColor: 'bg-amber-500', headerBg: 'bg-amber-50/80 border-amber-200/80 text-amber-900', colBg: 'bg-amber-50/20' },
  { id: 'confirmée', title: 'Confirmée', dotColor: 'bg-blue-500', headerBg: 'bg-blue-50/80 border-blue-200/80 text-blue-900', colBg: 'bg-blue-50/20' },
  { id: 'expédiée', title: 'Expédiée', dotColor: 'bg-orange-500', headerBg: 'bg-orange-50/80 border-orange-200/80 text-orange-900', colBg: 'bg-orange-50/20' },
  { id: 'livrée', title: 'Livrée', dotColor: 'bg-emerald-500', headerBg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900', colBg: 'bg-emerald-50/20' },
  { id: 'annulée', title: 'Annulée', dotColor: 'bg-rose-500', headerBg: 'bg-rose-50/80 border-rose-200/80 text-rose-900', colBg: 'bg-rose-50/20' }
];

export default function OrderKanban({ orders, updateOrderStatus, orderSearchTerm, onDeleteOrder, onPrintOrder, onSendToDelivery }: OrderKanbanProps) {
  const filteredOrders = orders.filter(order => 
    !orderSearchTerm || 
    (order.order_id && order.order_id.toLowerCase().includes(orderSearchTerm.toLowerCase())) || 
    order.id.toString().includes(orderSearchTerm) ||
    (order.customer_name && order.customer_name.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
    (order.customer_phone && order.customer_phone.includes(orderSearchTerm))
  );

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const orderId = parseInt(draggableId.replace('order-', ''), 10);
    const newStatus = destination.droppableId;

    updateOrderStatus(orderId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[620px] items-start">
        {COLUMNS.map(column => {
          const columnOrders = filteredOrders.filter(o => o.status === column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80 rounded-2xl border border-gray-200/90 flex flex-col bg-gray-50/60 overflow-hidden shadow-xs">
              <div className={`p-3.5 border-b font-bold flex justify-between items-center ${column.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                  <span className="text-sm font-bold tracking-tight">{column.title}</span>
                </div>
                <span className="bg-white/90 border border-gray-200/60 font-mono font-bold px-2.5 py-0.5 rounded-full text-xs text-gray-800 shadow-xs">
                  {columnOrders.length}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 flex-1 flex flex-col gap-3 min-h-[160px] transition-colors ${snapshot.isDraggingOver ? 'bg-orange-50/40' : ''}`}
                  >
                    {columnOrders.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-28 border-2 border-dashed border-gray-200/80 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                        Aucune commande
                      </div>
                    )}
                    {columnOrders.map((order, index) => (
                      // @ts-ignore
                      <Draggable key={order.id} draggableId={`order-${order.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-xl shadow-xs border border-gray-200/80 flex flex-col gap-2.5 transition-all cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging 
                                ? 'shadow-xl ring-2 ring-orange-500 scale-[1.02] z-50' 
                                : 'hover:shadow-md hover:border-orange-300'
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">
                                {order.order_id || `#${order.id}`}
                              </span>
                              <span className="font-extrabold text-sm text-orange-600 font-mono">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                            
                            <div>
                              <div className="font-bold text-sm text-gray-900 leading-tight">{order.customer_name}</div>
                              {order.customer_phone && (
                                <div className="text-xs font-mono text-gray-500 mt-1 flex items-center gap-1">
                                  <Phone size={11} className="text-gray-400" />
                                  <span>{order.customer_phone}</span>
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                                <MapPin size={12} className="text-orange-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-1" title={`${order.wilaya} ${order.commune ? `- ${order.commune}` : ''} - ${order.address}`}>
                                  {order.wilaya} {order.commune && `- ${order.commune}`}
                                </span>
                              </div>
                              {order.delivery_company && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <span className="text-[10px] px-2 py-0.5 rounded-md uppercase font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    ECOM-DZ
                                  </span>
                                  {order.stop_desk && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                                      Stopdesk
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-1 pt-2.5 border-t border-gray-100">
                              <div className="text-[11px] text-gray-400 font-medium">
                                {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}{' '}
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {onSendToDelivery && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onSendToDelivery(order.id); }}
                                    className="p-1.5 text-gray-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition border border-orange-200/60"
                                    title="Envoyer à la livraison"
                                  >
                                    <Truck size={14} />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onPrintOrder(order.id); }}
                                  className="p-1.5 text-gray-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200/60"
                                  title="Imprimer"
                                >
                                  <Printer size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                                  className="p-1.5 text-gray-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200/60"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
