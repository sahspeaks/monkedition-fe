// Custom ProfileSelectTile component for dropdown
// Indian States List
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const ProfileSelectTile = ({
  title,
  name,
  value,
  handleInputChange,
  options,
  placeholder,
  required,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="block text-xs font-medium text-gray-400 mb-1 ">{title}</p>
      <select
        name={name}
        value={value}
        onChange={handleInputChange}
        className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export { ProfileSelectTile, INDIAN_STATES };
