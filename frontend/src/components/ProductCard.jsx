export default function ProductCard({ product }) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-bold text-blue-400">{product.name}</h2>
      <p>ID: {product.id}</p>
      <p>Owner: {product.owner}</p>
    </div>
  );
}