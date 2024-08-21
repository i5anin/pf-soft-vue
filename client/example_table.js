const Types = [
  { t_id: 1, t_title: 'Type 1' },
  { t_id: 2, t_title: 'Type 2' },
  { t_id: 3, t_title: 'Type 3' },
]

const SubTypes = [
  { s_id: 1, s_title: 'SubType 1', type_id: 1 },
  { s_id: 2, s_title: '10', type_id: 3 },
  { s_id: 3, s_title: 'SubType 3', type_id: 2 },
  { s_id: 4, s_title: 'SubType 4', type_id: 2 },
  { s_id: 5, s_title: 'SubType 5', type_id: 1 },
  { s_id: 6, s_title: '25', type_id: 3 },
]

const Products = [
  { id: 1, title: 'Product 1', subtype_id: 6 },
  { id: 2, title: 'Product 2', subtype_id: 4 },
  { id: 3, title: 'Product 3', subtype_id: 3 },
  { id: 4, title: 'Product 4', subtype_id: 1 },
  { id: 5, title: 'Product 5', subtype_id: 2 },
  { id: 6, title: 'Product 6', subtype_id: 1 },
  { id: 7, title: 'Product 7', subtype_id: 3 },
  { id: 8, title: 'Product 8', subtype_id: 6 },
  { id: 9, title: 'Product 9', subtype_id: 5 },
  { id: 10, title: 'Product 10', subtype_id: 4 },
  { id: 11, title: 'Product 11', subtype_id: 5 },
  { id: 12, title: 'Product 12', subtype_id: 2 },
]

const ProdTable = [
  { id: 1, title: 'Product1', type_id: 2, diametr_id: 4, material_id: 5 },
]

;('SELECT * FROM products WHERE type_id = 2 AND diametr_id = 4 AND material_id = 5')
