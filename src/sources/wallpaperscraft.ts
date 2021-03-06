import cheerio from 'cheerio'
import axios from 'axios'
import { Category, CategoryDetails, Source } from '../types'

const width = 1920
const height = 1080

async function request(path: string) {
  const url = `https://wallpaperscraft.ru${path}`
  
  return (await axios.get(url)).data
}

async function loadPage(category: Category | null, num: number) {
  return await request(`/${category ? 'catalog/'+category.id : 'all'}/downloads/${width}x${height}/page${num}`)
}

export class WallpaperCraft implements Source {

  async downloadImage(id: string): Promise<Buffer> {
    const url = `https://images.wallpaperscraft.ru/image/${id}_${width}x${height}.jpg`
    const response = await axios.get(url, { responseType: 'arraybuffer' })
  
    return Buffer.from(response.data, 'binary')
  }

  async getCategories(): Promise<Category[]> {
    const data = await request('/')
  
    const $ = cheerio.load(data)
    const categories = $('.content-sidebar .filters').filter((i, el) => $(el).find('.filters__heading').text() === 'Все категории').find('.filter__link').toArray().map(el => ({
      id: $(el).attr('href')?.split('/')[2] as string,
      text: $(el).text()
    }))
  
    return categories
  }

  async getImages(category: Category | null, page: number): Promise<string[]> {
    const data = await loadPage(category, page)
  
    const $ = cheerio.load(data)
  
    const hrefs = $('.wallpapers__item .wallpapers__link').toArray().map(el => $(el).attr('href'))
  
    return hrefs.map(href => href?.split('/')[2]).filter(h => h) as string[]
  }

  async getCategoryDetails(category: Category | null): Promise<CategoryDetails> {
    const data = await loadPage(category, 1)
  
    const $ = cheerio.load(data)
    const lastPageHref = $('.pager__item.pager__item_last-page').find('.pager__link').attr('href')
    const pagesCount = +(lastPageHref?.split('/page')[1] || 0)
  
    return { pagesCount }
  }
}