

const Badge = ({book}) => {
  return (
    <span className="px-2 py-[3px] text-[12px] font-semibold bg-[#4B6BFB] text-[#FFFFFF] rounded-sm self-start">
      {book?.category_display}
    </span>
  );
};

export default Badge;
