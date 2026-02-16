import { BiMessageSquareAdd } from 'react-icons/bi';

const CommentButton = ({ position, onClick, visible }) => {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all transform hover:scale-110"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
      title="Добавить комментарий"
    >
      <BiMessageSquareAdd size={20} />
    </button>
  );
};

export default CommentButton;
