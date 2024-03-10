const { blobServiceClient } = require('./get-blob-client')

const getBlob = async (filename, containerName, directory) => {
  const container = blobServiceClient.getContainerClient(containerName)
  await container.createIfNotExists()
  return container.getBlockBlobClient(`${directory}${filename}`)
}

const listBlobs = async (containerName, directory) => {
  const maxPageSize = 2

  const listOptions = {
    includeMetadata: false,
    includeSnapshots: false,
    includeTags: false,
    includeVersions: false,
    prefix: ''
  }

  const containerClient = blobServiceClient.getContainerClient(containerName)
  const iterator = containerClient.listBlobsFlat(listOptions).byPage({ maxPageSize })
  const response = (await iterator.next()).value

  const blobs = []

  for (const blob of response.segment.blobItems) {
    blobs.push(blob.name)
  }

  return blobs
}

const listDirectories = async (containerName, directory) => {
  const containerClient = blobServiceClient.getContainerClient(containerName)
  const iterator = containerClient.listBlobsByHierarchy('/', { prefix: directory })
  const directories = []

  for await (const item of iterator) {
    if (item.kind === 'prefix') {
      directories.push(item.name)
    }
  }

  return directories
}

const getDirectories = async (containerName, directory) => {
  const directories = await listDirectories(containerName, directory)
  console.log(directories)
  const json = directories.reduce((acc, path) => {
    const [, persona, version] = path.split('/')
    if (!acc.persona) {
      acc.persona = {
        name: persona,
        versions: [],
        latestVersion: 0
      }
    }
    const versionNumber = parseInt(version, 10)
    acc.persona.versions.push(versionNumber)
    acc.persona.versions.sort((a, b) => a - b)
    acc.persona.latestVersion = Math.max(acc.persona.latestVersion, versionNumber)
    return acc
  }, {})

  return json
}

const uploadFile = async (filename, stream, containerName, directory) => {
  const blob = await getBlob(filename, containerName, directory)

  await blob.uploadStream(stream)

  return blob
}

const uploadText = async (filename, text, containerName, directory) => {
  const blob = await getBlob(filename, containerName, directory)

  const textBuffer = Buffer.from(text, 'utf-8')

  await blob.uploadData(textBuffer)

  return blob
}

const downloadFile = async (filename, containerName, directory) => {
  const blob = await getBlob(filename, containerName, directory)

  const downloadBlockBlobResponse = await blob.download(0)
  const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)

  return downloaded
}

const downloadFileToString = async (filename, containerName, directory) => {
  const downloaded = await downloadFile(filename, containerName, directory)
  return downloaded.toString('utf-8')
}

const streamToBuffer = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
    })
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    readableStream.on('error', reject)
  })
}

module.exports = {
  uploadFile,
  uploadText,
  downloadFile,
  downloadFileToString,
  listDirectories,
  getDirectories,
  listBlobs
}
