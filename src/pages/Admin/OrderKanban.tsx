import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { formatPrice } from '../../utils/formatPrice';
import { Printer, Trash2 } from 'lucide-react';

interface OrderKanbanProps {
  orders: any[];
  updateOrderStatus: (id: number, status: string) => void;
  orderSearchTerm: string;
  onDeleteOrder: (id: number) => void;
  onPrintOrder: (id: number) => void;
}

const COLUMNS = [
  { id: 'nouvelle', title: 'En attente', color: 'bg-yellow-50', headerColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'confirmée', title: 'Confirmée', color: 'bg-blue-50', headerColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'expédiée', title: 'Expédiée', color: 'bg-orange-50', headerColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'livrée', title: 'Livrée', color: 'bg-green-50', headerColor: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'annulée', title: 'Annulée', color: 'bg-red-50', headerColor: 'bg-red-100 text-red-800 border-red-200' }
];

export default function OrderKanban({ orders, updateOrderStatus, orderSearchTerm, onDeleteOrder, onPrintOrder }: OrderKanbanProps) {
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
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px] items-start">
        {COLUMNS.map(column => {
          const columnOrders = filteredOrders.filter(o => o.status === column.id);
          
          return (
            <div key={column.id} className={`flex-shrink-0 w-80 rounded-xl border border-gray-200 flex flex-col ${column.color}`}>
              <div className={`p-3 border-b rounded-t-xl font-bold flex justify-between items-center ${column.headerColor}`}>
                <span>{column.title}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">{columnOrders.length}</span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 flex-1 flex flex-col gap-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-black/5' : ''}`}
                  >
                    {columnOrders.map((order, index) => (
                      // @ts-ignore
                      <Draggable key={order.id} draggableId={`order-${order.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-2 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-orange-500 ring-opacity-50' : 'hover:shadow-md'}`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-gray-900">{order.order_id || `#${order.id}`}</span>
                              <span className="font-bold text-orange-600">{formatPrice(order.total_amount)}</span>
                            </div>
                            
                            <div>
                              <div className="font-medium text-gray-800">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_phone}</div>
                              <div className="text-xs text-gray-500 truncate mt-1" title={order.address}>{order.wilaya} - {order.address}</div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-400">
                                {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => onPrintOrder(order.id)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Imprimer"
                                >
                                  <Printer size={16} />
                                </button>
                                <button 
                                  onClick={() => onDeleteOrder(order.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
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
