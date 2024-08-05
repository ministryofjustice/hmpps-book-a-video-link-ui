import nock from 'nock'
import express from 'express'
import { PassThrough } from 'stream'

import { AgentConfig } from '../config'
import RestClient, { TokenType } from './restClient'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

class TestRestClient extends RestClient {
  constructor() {
    super('api-name', {
      url: 'http://localhost:8080/api',
      timeout: {
        response: 1000,
        deadline: 1000,
      },
      agent: new AgentConfig(1000),
    })
  }
}

const restClient = new TestRestClient()

describe.each(['get', 'patch', 'post', 'put', 'delete'] as const)('Method: %s', method => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return response body', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
      },
      user,
    )

    expect(nock.isDone()).toBe(true)

    expect(result).toStrictEqual({
      success: true,
    })
  })

  it('should return raw response body', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
        headers: { header1: 'headerValue1' },
        raw: true,
      },
      user,
    )

    expect(nock.isDone()).toBe(true)

    expect(result).toMatchObject({
      req: { method: method.toUpperCase() },
      status: 200,
      text: '{"success":true}',
    })
  })

  if (method === 'get' || method === 'delete') {
    it('should retry by default', async () => {
      jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer systemToken' },
      })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method](
          {
            path: '/test',
            headers: { header1: 'headerValue1' },
          },
          user,
        ),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
  } else {
    it('should not retry by default', async () => {
      jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer systemToken' },
      })
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method](
          {
            path: '/test',
            headers: { header1: 'headerValue1' },
          },
          user,
        ),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })

    it('should retry if configured to do so', async () => {
      jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer systemToken' },
      })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method](
          {
            path: '/test',
            headers: { header1: 'headerValue1' },
            retry: true,
          },
          user,
        ),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
  }

  it('can recover through retries', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
        headers: { header1: 'headerValue1' },
        retry: true,
      },
      user,
    )

    expect(result).toStrictEqual({ success: true })
    expect(nock.isDone()).toBe(true)
  })

  it("should use the user's token if configured to do so", async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer userToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
      },
      user,
      TokenType.USER_TOKEN,
    )

    expect(nock.isDone()).toBe(true)

    expect(result).toStrictEqual({
      success: true,
    })
  })

  it('should fetch a new system client token and cache it if one is not already cached', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue(null)
    const setToken = jest.spyOn(InMemoryTokenStore.prototype, 'setToken')

    nock('http://localhost:9090').post('/auth/oauth/token').reply(200, { access_token: 'newToken', expires_in: 220 })

    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer newToken' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method](
      {
        path: '/test',
      },
      user,
    )

    expect(nock.isDone()).toBe(true)
    expect(setToken).toHaveBeenCalledWith('jbloggs', 'newToken', 160)

    expect(result).toStrictEqual({
      success: true,
    })
  })
})

describe('Method: pipeFileStream', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should pipe the response stream successfully', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    const res = new PassThrough() as unknown as express.Response
    res.set = jest.fn()

    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      .get('/api/test-file')
      .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

    await restClient.pipeFileStream(
      {
        path: '/test-file',
      },
      res,
      user,
    )

    expect(res.set).toHaveBeenCalledWith('content-disposition', 'attachment; filename="file.txt"')
    res.on('data', chunk => {
      expect(chunk.toString()).toBe('file content')
    })

    expect(nock.isDone()).toBe(true)
  })

  it('should use the user token if specified', async () => {
    const res = new PassThrough() as unknown as express.Response
    res.set = jest.fn()

    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer userToken' },
    })
      .get('/api/test-file')
      .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

    await restClient.pipeFileStream(
      {
        path: '/test-file',
      },
      res,
      user,
      TokenType.USER_TOKEN,
    )

    expect(res.set).toHaveBeenCalledWith('content-disposition', 'attachment; filename="file.txt"')
    res.on('data', chunk => {
      expect(chunk.toString()).toBe('file content')
    })

    expect(nock.isDone()).toBe(true)
  })

  it('should handle failures', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
    const res = new PassThrough() as unknown as express.Response
    res.set = jest.fn()

    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer systemToken' },
    })
      .get('/api/test-file')
      .reply(500)

    await expect(
      restClient.pipeFileStream(
        {
          path: '/test-file',
        },
        res,
        user,
      ),
    ).rejects.toThrow()

    expect(nock.isDone()).toBe(true)
  })

  it('should fetch a new system client token and cache it if one is not already cached', async () => {
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue(null)
    const setToken = jest.spyOn(InMemoryTokenStore.prototype, 'setToken')

    nock('http://localhost:9090').post('/auth/oauth/token').reply(200, { access_token: 'newToken', expires_in: 220 })

    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer newToken' },
    })
      .get('/api/test-file')
      .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

    const res = new PassThrough() as unknown as express.Response
    res.set = jest.fn()

    await restClient.pipeFileStream(
      {
        path: '/test-file',
      },
      res,
      user,
    )

    expect(setToken).toHaveBeenCalledWith('jbloggs', 'newToken', 160)

    res.on('data', chunk => {
      expect(chunk.toString()).toBe('file content')
    })

    expect(nock.isDone()).toBe(true)
  })
})
