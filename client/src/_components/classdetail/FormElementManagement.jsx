// pages/FormElementManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { message } from 'antd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import FormElementList from './FormElementManagement/FormElementList';
import FormToolbar from './FormElementManagement/FormToolbar';
import FormActions from './FormElementManagement/FormActions';

export function FormElementManagement() {
    const { classId, testId } = useParams();
    const [formElements, setFormElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const history = useHistory();
    const [selectedElementIndex, setSelectedElementIndex] = useState(null);
    const elementRefs = useRef([]);

    useEffect(() => {
        const fetchFormElements = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/tests/${testId}/form-elements`);
                const data = await response.json();
                if (data.status === "Success" && data.message) {
                    if (data.message.formElements.length === 0) {
                        // Nếu không có elements, tạo một tiêu đề mặc định
                        setFormElements([{
                            type: 'section_title',
                            order: 1,
                            title: '<h1>Tiêu đề bài kiểm tra</h1>', // Hoặc một tiêu đề mặc định khác
                        }]);
                    } else {
                        setFormElements(data.message.formElements);
                    }
                } else {
                    message.error('Không thể tải nội dung bài kiểm tra.');
                }
            } catch (error) {
                console.error('Lỗi khi tải nội dung bài kiểm tra:', error);
                message.error('Có lỗi xảy ra khi tải dữ liệu.');
            } finally {
                setLoading(false);
            }
        };

        fetchFormElements();
    }, [testId]);

    useEffect(() => {
        elementRefs.current = formElements.map((_, i) => elementRefs.current[i] || React.createRef());
    }, [formElements]);

    useEffect(() => {
        if (
            selectedElementIndex !== null &&
            elementRefs.current[selectedElementIndex] &&
            elementRefs.current[selectedElementIndex].current
        ) {
            elementRefs.current[selectedElementIndex].current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedElementIndex]);

    const handleAddElement = (type) => {
        let newElement = {
            type: type,
        };

        if (type === 'multiple_choice') {
            newElement = {
                ...newElement,
                options: [{ text: '', isCorrect: false }],
            };
        }

        let updatedElements = [...formElements];
        let newElementIndex; // Keep track of the new element's index

        if (selectedElementIndex === null) {
            // Nếu không có phần tử nào được chọn, thêm vào cuối
            updatedElements.push(newElement);
            newElementIndex = updatedElements.length - 1; // Index of the last element
        } else {
            // Nếu có phần tử được chọn, thêm vào vị trí kế tiếp
            updatedElements.splice(selectedElementIndex + 1, 0, newElement);
            newElementIndex = selectedElementIndex + 1; // Index where the element was inserted
        }

        // Recalculate orders
        const updatedWithOrder = updatedElements.map((element, index) => ({
            ...element,
            order: index + 1,
        }));

        setFormElements(updatedWithOrder);
        setTimeout(() => {
            setSelectedElementIndex(newElementIndex); // Use the tracked index
        }, 0);
    };

    const handleElementChange = (index, changedFields) => {
        const updatedElements = [...formElements];
        changedFields.forEach(field => {
            updatedElements[index][field.name[0]] = field.value;
        });
        setFormElements(updatedElements);
    };

    const handleDeleteElement = (index) => {
        console.log('Xóa element có index:', index);
        const updatedElements = formElements.filter((_, i) => i !== index);

        // Recalculate orders after deletion
        const updatedWithOrder = updatedElements.map((element, index) => ({
            ...element,
            order: index + 1,
        }));

        setFormElements(updatedWithOrder);
        setSelectedElementIndex(null);
    };

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(formElements);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedElements = items.map((element, index) => ({
            ...element,
            order: index + 1,
        }));

        setFormElements(updatedElements);

        if (selectedElementIndex !== null) {
            if (result.source.index < result.destination.index) {
                // Kéo xuống
                if (selectedElementIndex === result.source.index) {
                    // Element được chọn bị kéo
                    setSelectedElementIndex(result.destination.index);
                } else if (selectedElementIndex > result.source.index && selectedElementIndex <= result.destination.index) {
                    // Element được chọn ở giữa
                    setSelectedElementIndex(selectedElementIndex - 1);
                }
            } else if (result.source.index > result.destination.index) {
                // Kéo lên
                if (selectedElementIndex === result.source.index) {
                    // Element được chọn bị kéo
                    setSelectedElementIndex(result.destination.index);
                } else if (selectedElementIndex < result.source.index && selectedElementIndex >= result.destination.index) {
                    // Element được chọn ở giữa
                    setSelectedElementIndex(selectedElementIndex + 1);
                }
            }
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/tests/${testId}/formElements`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ formElements }),
            });

            if (response.ok) {
                message.success('Lưu nội dung bài kiểm tra thành công.');
                history.push(`/class/${classId}`);
            } else {
                message.error('Có lỗi xảy ra khi lưu nội dung bài kiểm tra.');
            }
        } catch (error) {
            console.error('Lỗi khi lưu nội dung bài kiểm tra:', error);
            message.error('Có lỗi xảy ra khi lưu dữ liệu.');
        }
    };

    if (loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <div>
            <h2>Quản lý Nội dung Bài Kiểm Tra</h2>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                {/* Nội dung form */}
                <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                    <div style={{ width: '100%', maxWidth: 600 }}>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <Droppable droppableId="formElements">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        <FormElementList
                                            formElements={formElements}
                                            selectedElementIndex={selectedElementIndex}
                                            setSelectedElementIndex={setSelectedElementIndex}
                                            handleElementChange={handleElementChange}
                                            handleDeleteElement={handleDeleteElement}
                                            elementRefs={elementRefs}
                                        />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>

                {/* Thanh Toolbar cuộn theo */}
                <div
                    style={{
                        position: 'sticky',
                        top: 80,
                        alignSelf: 'flex-start',
                        zIndex: 10,
                        display: 'flex', // Thêm flexbox
                        flexDirection: 'column', // Sắp xếp theo chiều dọc
                        gap: '10px', // Khoảng cách giữa các phần tử
                    }}
                >
                    <FormToolbar onAddElement={handleAddElement} />
                    <FormActions onSave={handleSave} onCancel={() => history.push(`/class/${classId}`)} />
                </div>
            </div>
        </div>
    );
}

export default FormElementManagement;