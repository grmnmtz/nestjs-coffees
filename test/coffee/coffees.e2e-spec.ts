/* eslint-disable prettier/prettier */
import { Body, HttpStatus, INestApplication, Response } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CoffeesModule } from '../../src/coffees/coffees.module'
import { ValidationPipe } from '@nestjs/common'
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter'
import { TimeoutInterceptor } from '../../src/common/interceptors/timeout.interceptor'
import { WrapResponseInterceptor } from '../../src/common/interceptors/wrap-response.interceptor'
import { CreateCoffeeDto } from '../../src/coffees/dto/create-coffee.dto'
import { UpdateCoffeeDto } from '../../src/coffees/dto/update-coffee.dto'
import { response } from 'express'

describe('[Feature] Coffees - /coffees', () => {
  const coffee = {
    name: 'A great coffee',
    brand: 'Nescafe',
    flavors: ['chocolate', 'vanilla'],
  }

  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CoffeesModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'postgres',
          password: 'pass123',
          database: 'postgres',
          autoLoadEntities: true,
          synchronize: true,
        }),
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )

    await app.init()
  })

  it('Create one coffee [POST /] ', async () => {
    const response = await request(app.getHttpServer())
      .post('/coffees')
      .send(coffee as CreateCoffeeDto)

    expect(HttpStatus.CREATED)
    expect(response.body.name).toEqual('A great coffee')
    expect(response.body.brand).toEqual('Nescafe')
    expect(response.body.flavors.map((flavor) => flavor.name)).toEqual([
      'chocolate',
      'vanilla',
    ])
  })

  it('Gets All coffees [GET /]', async () => {
    const response = await request(app.getHttpServer()).get('/coffees')
    expect(200)
    expect(response.body).toHaveLength(1)
    expect(response.body).toEqual([
      {
        id: 1,
        name: 'A great coffee',
        description: null,
        brand: 'Nescafe',
        recommendations: 0,
        flavors: [
          { name: 'chocolate', id: 1 },
          { name: 'vanilla', id: 2 },
        ],
      },
    ])
  })

  it('Gets one existing coffee [GET /:id]', async () => {
    const response = await request(app.getHttpServer()).get('/coffees/1')
    expect(200)
    expect(response.body.name).toEqual('A great coffee')
    expect(response.body.brand).toEqual('Nescafe')
  })

  it('throws a 404 for missing coffee [GET /:id]', () => {
    return request(app.getHttpServer()).get('/coffees/3').expect(404)
  })

  it('responds with json [GET /]', async () => {
    const response = await request(app.getHttpServer())
      .get('/coffees')
      .set('Accept', 'application/json')
    expect(response.headers['content-type']).toMatch('application/json')
    expect(response.status).toEqual(200)
  })

  it('Updates existing coffee [PATCH /:id]', async () => {
    const response = await request(app.getHttpServer())
      .patch('/coffees/1')
      .send({
        name: 'An updated coffee',
        brand: 'Updated brand',
        flavors: ['test1', 'test2'],
      } as UpdateCoffeeDto)

    expect(200)
    expect(response.body.name).toEqual('An updated coffee')
    expect(response.body.brand).toEqual('Updated brand')
  })

  it('Gets the updated coffee [GET /:id]', async () => {
    const response = await request(app.getHttpServer()).get('/coffees/1')
    expect(200)
    expect(response.body).toEqual({
      id: 1,
      name: 'An updated coffee',
      description: null,
      brand: 'Updated brand',
      recommendations: 0,
      flavors: [
        { name: 'test1', id: 3 },
        { name: 'test2', id: 4 },
      ],
    })
  })

  it('does not update a non existing coffee  [PATCH /:id]', async () => {
    const response = await request(app.getHttpServer())
      .patch('/coffees/6')
      .send({
        name: 'An updated coffee',
        brand: 'Updated brand',
        flavors: ['test1', 'test2'],
      } as UpdateCoffeeDto)

    expect(404)
  })

  it('Delete One [DELETE /:id]', () => {
    return request(app.getHttpServer()).delete('/coffees/1').expect(200)
  })

  it('Should not find the missing coffee [GET /:id]', () => {
    return request(app.getHttpServer()).get('/coffees/1').expect(404)
  })

  it('Does not delete a non existing coffee [DELETE /:id]', () => {
    return request(app.getHttpServer()).delete('/coffees/5').expect(404)
  })

  afterAll(async () => {
    await app.close()
  })
})
