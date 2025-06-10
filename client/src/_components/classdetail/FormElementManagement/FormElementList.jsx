import React from 'react';
import { List } from 'antd';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import FormElement from './FormElement';

function FormElementList({ formElements, selectedElementIndex, setSelectedElementIndex, handleElementChange, handleDeleteElement, elementRefs }) {
    return (
        <Droppable droppableId="formElements">
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                    <List
                        dataSource={formElements}
                        renderItem={(element, index) => (
                            <Draggable
                                key={index}
                                draggableId={`formElement-${index}`}
                                index={index}
                            >
                                {(provided) => (
                                    <li
                                        ref={(el) => {
                                            provided.innerRef(el);
                                            if (elementRefs && elementRefs.current[index]) {
                                                elementRefs.current[index].current = el;
                                            }
                                        }}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <FormElement
                                            element={element}
                                            index={index}
                                            onChange={handleElementChange}
                                            onDelete={handleDeleteElement}
                                            isSelected={selectedElementIndex === index}
                                            onClick={() => setSelectedElementIndex(index)}
                                        />
                                    </li>
                                )}
                            </Draggable>
                        )}
                    />
                    {provided.placeholder} {/* Đảm bảo giữ placeholder này */}
                </div>
            )}
        </Droppable>
    );
}

export default FormElementList;