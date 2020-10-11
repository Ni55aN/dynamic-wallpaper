import fs from 'fs-extra'
import { basename, join } from 'path'

export class ImageStorage {

  async saveTemporary(id: string, image: Buffer) {
    const cwd = process.cwd()
    const path = join(cwd, 'tmp', id + '.jpg')

    await fs.ensureDir(join(cwd, 'tmp'))
    await fs.writeFile(path, image)

    return path
  }

  async save(path: string) {
    const cwd = process.cwd()

    await fs.ensureDir(join(cwd, 'saved'))
    await fs.copyFile(path, join(cwd, 'saved', basename(path)))
  }
}