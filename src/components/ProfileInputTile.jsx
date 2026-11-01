import React from "react";

function ProfileInputTile({
  isDisable = true,
  title,
  name,
  value,
  placeholder,
  handleInputChange,
  required,
  type = "text",
}) {
  return (
    <div className="flex-1 flex-col justify-center ">
      <p className="block text-xs font-medium text-gray-400 mb-1 ">{title}</p>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={!isDisable}
        onChange={handleInputChange}
        required={required}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
      />
    </div>
  );
}

export default ProfileInputTile;
