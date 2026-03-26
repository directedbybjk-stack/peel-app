// Fallback product data when the API is unavailable
// These are real products from Open Food Facts, cached locally

export const FALLBACK_CATALOG: Record<string, Array<{
  barcode: string;
  productName: string;
  brand: string;
  imageUrl: string;
  nutriscoreGrade?: string;
}>> = {
  'protein-bars': [
    { barcode: '0722252100900', productName: 'Chocolate Chip Energy Bar', brand: 'CLIF', imageUrl: 'https://images.openfoodfacts.org/images/products/072/225/210/0900/front_en.131.400.jpg', nutriscoreGrade: 'c' },
    { barcode: '0888849006052', productName: 'Protein Cookie', brand: 'Quest', imageUrl: 'https://images.openfoodfacts.org/images/products/088/884/900/6052/front_en.4.400.jpg', nutriscoreGrade: 'd' },
    { barcode: '0016000264601', productName: "Oats 'N Honey Granola Bars", brand: 'Nature Valley', imageUrl: 'https://images.openfoodfacts.org/images/products/001/600/026/4601/front_en.60.400.jpg', nutriscoreGrade: 'd' },
    { barcode: '5000159461122', productName: 'Snickers', brand: 'Snickers', imageUrl: 'https://images.openfoodfacts.org/images/products/500/015/946/1122/front_en.311.400.jpg', nutriscoreGrade: 'e' },
  ],
  'snacks': [
    { barcode: '7622300489434', productName: 'Oreo', brand: 'Mondelez', imageUrl: 'https://images.openfoodfacts.org/images/products/762/230/048/9434/front_en.96.400.jpg', nutriscoreGrade: 'e' },
    { barcode: '0044000032197', productName: 'Chips Ahoy! Chocolate Chip Cookies', brand: 'Chips Ahoy!', imageUrl: 'https://images.openfoodfacts.org/images/products/004/400/003/2197/front_en.50.400.jpg', nutriscoreGrade: 'e' },
    { barcode: '3017620422003', productName: 'Nutella', brand: 'Nutella', imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.820.400.jpg', nutriscoreGrade: 'e' },
    { barcode: '0038000138416', productName: 'Pringles Original', brand: 'Pringles', imageUrl: 'https://images.openfoodfacts.org/images/products/003/800/013/8416/front_en.140.400.jpg', nutriscoreGrade: 'd' },
  ],
  'cereals': [
    { barcode: '0016000275287', productName: 'Cheerios', brand: 'General Mills', imageUrl: 'https://images.openfoodfacts.org/images/products/001/600/027/5287/front_en.8.400.jpg', nutriscoreGrade: 'a' },
    { barcode: '0016000124790', productName: 'Honey Nut Cheerios', brand: 'General Mills', imageUrl: 'https://images.openfoodfacts.org/images/products/001/600/012/4790/front_en.111.400.jpg', nutriscoreGrade: 'b' },
    { barcode: '0038000291210', productName: 'Rice Krispies', brand: "Kellogg's", imageUrl: 'https://images.openfoodfacts.org/images/products/003/800/029/1210/front_en.11.400.jpg', nutriscoreGrade: 'd' },
    { barcode: '3168930010265', productName: 'Quaker Cruesly Granola', brand: 'Quaker', imageUrl: 'https://images.openfoodfacts.org/images/products/316/893/001/0265/front_en.297.400.jpg', nutriscoreGrade: 'b' },
  ],
  'drinks': [
    { barcode: '0049000006346', productName: 'Coca-Cola', brand: 'Coca-Cola', imageUrl: 'https://images.openfoodfacts.org/images/products/004/900/000/6346/front_en.16.400.jpg', nutriscoreGrade: 'e' },
    { barcode: '0049000042566', productName: 'Coca-Cola Zero Sugar', brand: 'Coca-Cola', imageUrl: 'https://images.openfoodfacts.org/images/products/004/900/004/2566/front_en.108.400.jpg', nutriscoreGrade: 'a' },
    { barcode: '0052000042894', productName: 'Gatorade Essential', brand: 'Gatorade', imageUrl: 'https://images.openfoodfacts.org/images/products/005/200/004/2894/front_en.3.400.jpg', nutriscoreGrade: 'd' },
    { barcode: '5449000014535', productName: 'Sprite', brand: 'Sprite', imageUrl: 'https://images.openfoodfacts.org/images/products/544/900/001/4535/front_en.132.400.jpg', nutriscoreGrade: 'd' },
  ],
};
