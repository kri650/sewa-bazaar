
export default function VegetablesDropdown() {
  return (
    <div className="veg-dropdown">
      <ul className="veg-dropdown-list">
        <li>
          <a href="/vegetables/leafy-vegetables" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
            Leafy Vegetables
          </a>
        </li>
        <li>Regular Vegetables</li>
        <li>Exotic Vegetables</li>
        <li>Gourds and Pumpkin</li>
        <li>Salad Vegetables</li>
        <li>Organic Vegetable Boxes</li>
      </ul>
      <style jsx global>{`
        .veg-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 9999;
          background: #fff;
          display: none;
          max-width: 240px;
          min-width: 180px;
          box-shadow: 0 8px 32px rgba(40,60,20,0.13);
          border-radius: 8px;
          border: 1px solid #e6efe3;
        }
        .veg-dropdown-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
        }
        .veg-dropdown-list li {
          display: block;
          padding: 7px 14px;
          color: #1f3a2b;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          font-size: 15px;
          line-height: 1.2;
          transition: background 0.15s, color 0.15s;
        }
        .veg-dropdown-list li:hover {
          background: #f6fbf6;
          color: #4f8525;
        }
      `}</style>
    </div>
  );
}