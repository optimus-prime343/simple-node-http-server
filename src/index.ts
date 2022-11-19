import dotenv from 'dotenv'
import fs from 'fs'
import http from 'http'
import path from 'path'

import { TProduct } from './types/product'

dotenv.config()

const ROOT_DIR = process.cwd()
const DATA_DIR = path.join(ROOT_DIR, 'src', 'data')
const TEMPLATES_DIR = path.join(ROOT_DIR, 'src', 'templates')

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000
const HOST_NAME = process.env.HOST_NAME ?? 'localhost'

const products: TProduct[] = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf-8'),
)
const productItemHTMLTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'product-item.html'),
  'utf-8',
)
const productListHTMLTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'product-list.html'),
  'utf-8',
)
const productDetailHTMLTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'product-detail.html'),
  'utf-8',
)
const productListByCategoryTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'product-list-by-category.html'),
  'utf-8',
)

const generateProductListHTML = (products: TProduct[]): string => {
  const productListHTML = products
    .map(product =>
      productItemHTMLTemplate
        .replace('{{product_id}}', product.id.toString())
        .replace('{{product_category}}', product.category)
        .replace('{{product_image}}', product.image)
        .replace('{{product_alt}}', product.title)
        .replace('{{product_category}}', product.category)
        .replace('{{product_title}}', product.title)
        .replace('{{product_price}}', product.price.toString()),
    )
    .join('')
  return productListHTMLTemplate.replace('{{product_list}}', productListHTML)
}
const generateProductDetailHTML = (id: number): string => {
  const product = products.find(product => product.id === id)
  if (!product) return 'Product not found'
  return productDetailHTMLTemplate
    .replaceAll('{{product_title}}', product.title)
    .replace('{{product_image}}', product.image)
    .replace('{{product_alt}}', product.title)
    .replace('{{product_category}}', product.category)
    .replace('{{product_price}}', product.price.toString())
    .replace('{{product_description}}', product.description)
}
const generateProductListByCategoryHTML = (category: string): string => {
  const productsByCategory = products.filter(
    product => product.category === category,
  )
  const productListHTML = generateProductListHTML(productsByCategory)
  return productListByCategoryTemplate
    .replace('{{product_list_by_category}}', productListHTML)
    .replaceAll('{{product_category}}', category)
}

const productListHTML = generateProductListHTML([...products])

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`)
  const searchParams = new URLSearchParams(url.search)

  if (url.pathname === '/' || url.pathname === '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    })
    res.end(productListHTML)
    return
  }
  if (url.pathname === '/detail') {
    const id = searchParams.get('id')
    if (id === null) {
      res.writeHead(404)
      res.end('Invalid request')
      return
    }
    const productDetailHTML = generateProductDetailHTML(parseInt(id, 10))
    res.writeHead(200, {
      'Content-type': 'text/html',
    })
    res.end(productDetailHTML)
    return
  }
  if (url.pathname === '/category') {
    const categoryName = searchParams.get('name')
    if (categoryName === null) {
      res.writeHead(404)
      res.end('Invalid request')
      return
    }
    const productListByCategoryHTML =
      generateProductListByCategoryHTML(categoryName)
    res.writeHead(200, {
      'Content-type': 'text/html',
    })
    res.end(productListByCategoryHTML)
    return
  }
  res.end('Not found')
})

server.listen(PORT, HOST_NAME, (): void => {
  console.log(`Server running on port ${PORT}`)
})
