
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model BattleProblem
 * 
 */
export type BattleProblem = $Result.DefaultSelection<Prisma.$BattleProblemPayload>
/**
 * Model BattleTestCase
 * 
 */
export type BattleTestCase = $Result.DefaultSelection<Prisma.$BattleTestCasePayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more BattleProblems
 * const battleProblems = await prisma.battleProblem.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more BattleProblems
   * const battleProblems = await prisma.battleProblem.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.battleProblem`: Exposes CRUD operations for the **BattleProblem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BattleProblems
    * const battleProblems = await prisma.battleProblem.findMany()
    * ```
    */
  get battleProblem(): Prisma.BattleProblemDelegate<ExtArgs>;

  /**
   * `prisma.battleTestCase`: Exposes CRUD operations for the **BattleTestCase** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BattleTestCases
    * const battleTestCases = await prisma.battleTestCase.findMany()
    * ```
    */
  get battleTestCase(): Prisma.BattleTestCaseDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    BattleProblem: 'BattleProblem',
    BattleTestCase: 'BattleTestCase'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "battleProblem" | "battleTestCase"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      BattleProblem: {
        payload: Prisma.$BattleProblemPayload<ExtArgs>
        fields: Prisma.BattleProblemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BattleProblemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BattleProblemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>
          }
          findFirst: {
            args: Prisma.BattleProblemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BattleProblemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>
          }
          findMany: {
            args: Prisma.BattleProblemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>[]
          }
          create: {
            args: Prisma.BattleProblemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>
          }
          createMany: {
            args: Prisma.BattleProblemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BattleProblemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>[]
          }
          delete: {
            args: Prisma.BattleProblemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>
          }
          update: {
            args: Prisma.BattleProblemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>
          }
          deleteMany: {
            args: Prisma.BattleProblemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BattleProblemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BattleProblemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleProblemPayload>
          }
          aggregate: {
            args: Prisma.BattleProblemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBattleProblem>
          }
          groupBy: {
            args: Prisma.BattleProblemGroupByArgs<ExtArgs>
            result: $Utils.Optional<BattleProblemGroupByOutputType>[]
          }
          count: {
            args: Prisma.BattleProblemCountArgs<ExtArgs>
            result: $Utils.Optional<BattleProblemCountAggregateOutputType> | number
          }
        }
      }
      BattleTestCase: {
        payload: Prisma.$BattleTestCasePayload<ExtArgs>
        fields: Prisma.BattleTestCaseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BattleTestCaseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BattleTestCaseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>
          }
          findFirst: {
            args: Prisma.BattleTestCaseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BattleTestCaseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>
          }
          findMany: {
            args: Prisma.BattleTestCaseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>[]
          }
          create: {
            args: Prisma.BattleTestCaseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>
          }
          createMany: {
            args: Prisma.BattleTestCaseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BattleTestCaseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>[]
          }
          delete: {
            args: Prisma.BattleTestCaseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>
          }
          update: {
            args: Prisma.BattleTestCaseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>
          }
          deleteMany: {
            args: Prisma.BattleTestCaseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BattleTestCaseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BattleTestCaseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BattleTestCasePayload>
          }
          aggregate: {
            args: Prisma.BattleTestCaseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBattleTestCase>
          }
          groupBy: {
            args: Prisma.BattleTestCaseGroupByArgs<ExtArgs>
            result: $Utils.Optional<BattleTestCaseGroupByOutputType>[]
          }
          count: {
            args: Prisma.BattleTestCaseCountArgs<ExtArgs>
            result: $Utils.Optional<BattleTestCaseCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type BattleProblemCountOutputType
   */

  export type BattleProblemCountOutputType = {
    testCases: number
  }

  export type BattleProblemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testCases?: boolean | BattleProblemCountOutputTypeCountTestCasesArgs
  }

  // Custom InputTypes
  /**
   * BattleProblemCountOutputType without action
   */
  export type BattleProblemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblemCountOutputType
     */
    select?: BattleProblemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BattleProblemCountOutputType without action
   */
  export type BattleProblemCountOutputTypeCountTestCasesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleTestCaseWhereInput
  }


  /**
   * Models
   */

  /**
   * Model BattleProblem
   */

  export type AggregateBattleProblem = {
    _count: BattleProblemCountAggregateOutputType | null
    _min: BattleProblemMinAggregateOutputType | null
    _max: BattleProblemMaxAggregateOutputType | null
  }

  export type BattleProblemMinAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    difficulty: string | null
    statement: string | null
    constraints: string | null
    inputFormat: string | null
    outputFormat: string | null
    functionName: string | null
    returnType: string | null
    starterCode: string | null
    language: string | null
    category: string | null
    isPublished: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BattleProblemMaxAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    difficulty: string | null
    statement: string | null
    constraints: string | null
    inputFormat: string | null
    outputFormat: string | null
    functionName: string | null
    returnType: string | null
    starterCode: string | null
    language: string | null
    category: string | null
    isPublished: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BattleProblemCountAggregateOutputType = {
    id: number
    title: number
    slug: number
    difficulty: number
    statement: number
    constraints: number
    inputFormat: number
    outputFormat: number
    functionName: number
    returnType: number
    paramTypes: number
    paramNames: number
    starterCode: number
    language: number
    tags: number
    category: number
    isPublished: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BattleProblemMinAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    difficulty?: true
    statement?: true
    constraints?: true
    inputFormat?: true
    outputFormat?: true
    functionName?: true
    returnType?: true
    starterCode?: true
    language?: true
    category?: true
    isPublished?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BattleProblemMaxAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    difficulty?: true
    statement?: true
    constraints?: true
    inputFormat?: true
    outputFormat?: true
    functionName?: true
    returnType?: true
    starterCode?: true
    language?: true
    category?: true
    isPublished?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BattleProblemCountAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    difficulty?: true
    statement?: true
    constraints?: true
    inputFormat?: true
    outputFormat?: true
    functionName?: true
    returnType?: true
    paramTypes?: true
    paramNames?: true
    starterCode?: true
    language?: true
    tags?: true
    category?: true
    isPublished?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BattleProblemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BattleProblem to aggregate.
     */
    where?: BattleProblemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleProblems to fetch.
     */
    orderBy?: BattleProblemOrderByWithRelationInput | BattleProblemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BattleProblemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleProblems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleProblems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BattleProblems
    **/
    _count?: true | BattleProblemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BattleProblemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BattleProblemMaxAggregateInputType
  }

  export type GetBattleProblemAggregateType<T extends BattleProblemAggregateArgs> = {
        [P in keyof T & keyof AggregateBattleProblem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBattleProblem[P]>
      : GetScalarType<T[P], AggregateBattleProblem[P]>
  }




  export type BattleProblemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleProblemWhereInput
    orderBy?: BattleProblemOrderByWithAggregationInput | BattleProblemOrderByWithAggregationInput[]
    by: BattleProblemScalarFieldEnum[] | BattleProblemScalarFieldEnum
    having?: BattleProblemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BattleProblemCountAggregateInputType | true
    _min?: BattleProblemMinAggregateInputType
    _max?: BattleProblemMaxAggregateInputType
  }

  export type BattleProblemGroupByOutputType = {
    id: string
    title: string
    slug: string
    difficulty: string
    statement: string
    constraints: string | null
    inputFormat: string | null
    outputFormat: string | null
    functionName: string
    returnType: string
    paramTypes: string[]
    paramNames: string[]
    starterCode: string
    language: string
    tags: string[]
    category: string | null
    isPublished: boolean
    createdAt: Date
    updatedAt: Date
    _count: BattleProblemCountAggregateOutputType | null
    _min: BattleProblemMinAggregateOutputType | null
    _max: BattleProblemMaxAggregateOutputType | null
  }

  type GetBattleProblemGroupByPayload<T extends BattleProblemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BattleProblemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BattleProblemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BattleProblemGroupByOutputType[P]>
            : GetScalarType<T[P], BattleProblemGroupByOutputType[P]>
        }
      >
    >


  export type BattleProblemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    difficulty?: boolean
    statement?: boolean
    constraints?: boolean
    inputFormat?: boolean
    outputFormat?: boolean
    functionName?: boolean
    returnType?: boolean
    paramTypes?: boolean
    paramNames?: boolean
    starterCode?: boolean
    language?: boolean
    tags?: boolean
    category?: boolean
    isPublished?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    testCases?: boolean | BattleProblem$testCasesArgs<ExtArgs>
    _count?: boolean | BattleProblemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["battleProblem"]>

  export type BattleProblemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    difficulty?: boolean
    statement?: boolean
    constraints?: boolean
    inputFormat?: boolean
    outputFormat?: boolean
    functionName?: boolean
    returnType?: boolean
    paramTypes?: boolean
    paramNames?: boolean
    starterCode?: boolean
    language?: boolean
    tags?: boolean
    category?: boolean
    isPublished?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["battleProblem"]>

  export type BattleProblemSelectScalar = {
    id?: boolean
    title?: boolean
    slug?: boolean
    difficulty?: boolean
    statement?: boolean
    constraints?: boolean
    inputFormat?: boolean
    outputFormat?: boolean
    functionName?: boolean
    returnType?: boolean
    paramTypes?: boolean
    paramNames?: boolean
    starterCode?: boolean
    language?: boolean
    tags?: boolean
    category?: boolean
    isPublished?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BattleProblemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    testCases?: boolean | BattleProblem$testCasesArgs<ExtArgs>
    _count?: boolean | BattleProblemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BattleProblemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $BattleProblemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BattleProblem"
    objects: {
      testCases: Prisma.$BattleTestCasePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      slug: string
      difficulty: string
      statement: string
      constraints: string | null
      inputFormat: string | null
      outputFormat: string | null
      functionName: string
      returnType: string
      paramTypes: string[]
      paramNames: string[]
      starterCode: string
      language: string
      tags: string[]
      category: string | null
      isPublished: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["battleProblem"]>
    composites: {}
  }

  type BattleProblemGetPayload<S extends boolean | null | undefined | BattleProblemDefaultArgs> = $Result.GetResult<Prisma.$BattleProblemPayload, S>

  type BattleProblemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BattleProblemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BattleProblemCountAggregateInputType | true
    }

  export interface BattleProblemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BattleProblem'], meta: { name: 'BattleProblem' } }
    /**
     * Find zero or one BattleProblem that matches the filter.
     * @param {BattleProblemFindUniqueArgs} args - Arguments to find a BattleProblem
     * @example
     * // Get one BattleProblem
     * const battleProblem = await prisma.battleProblem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BattleProblemFindUniqueArgs>(args: SelectSubset<T, BattleProblemFindUniqueArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one BattleProblem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BattleProblemFindUniqueOrThrowArgs} args - Arguments to find a BattleProblem
     * @example
     * // Get one BattleProblem
     * const battleProblem = await prisma.battleProblem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BattleProblemFindUniqueOrThrowArgs>(args: SelectSubset<T, BattleProblemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first BattleProblem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemFindFirstArgs} args - Arguments to find a BattleProblem
     * @example
     * // Get one BattleProblem
     * const battleProblem = await prisma.battleProblem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BattleProblemFindFirstArgs>(args?: SelectSubset<T, BattleProblemFindFirstArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first BattleProblem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemFindFirstOrThrowArgs} args - Arguments to find a BattleProblem
     * @example
     * // Get one BattleProblem
     * const battleProblem = await prisma.battleProblem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BattleProblemFindFirstOrThrowArgs>(args?: SelectSubset<T, BattleProblemFindFirstOrThrowArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more BattleProblems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BattleProblems
     * const battleProblems = await prisma.battleProblem.findMany()
     * 
     * // Get first 10 BattleProblems
     * const battleProblems = await prisma.battleProblem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const battleProblemWithIdOnly = await prisma.battleProblem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BattleProblemFindManyArgs>(args?: SelectSubset<T, BattleProblemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a BattleProblem.
     * @param {BattleProblemCreateArgs} args - Arguments to create a BattleProblem.
     * @example
     * // Create one BattleProblem
     * const BattleProblem = await prisma.battleProblem.create({
     *   data: {
     *     // ... data to create a BattleProblem
     *   }
     * })
     * 
     */
    create<T extends BattleProblemCreateArgs>(args: SelectSubset<T, BattleProblemCreateArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many BattleProblems.
     * @param {BattleProblemCreateManyArgs} args - Arguments to create many BattleProblems.
     * @example
     * // Create many BattleProblems
     * const battleProblem = await prisma.battleProblem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BattleProblemCreateManyArgs>(args?: SelectSubset<T, BattleProblemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BattleProblems and returns the data saved in the database.
     * @param {BattleProblemCreateManyAndReturnArgs} args - Arguments to create many BattleProblems.
     * @example
     * // Create many BattleProblems
     * const battleProblem = await prisma.battleProblem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BattleProblems and only return the `id`
     * const battleProblemWithIdOnly = await prisma.battleProblem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BattleProblemCreateManyAndReturnArgs>(args?: SelectSubset<T, BattleProblemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a BattleProblem.
     * @param {BattleProblemDeleteArgs} args - Arguments to delete one BattleProblem.
     * @example
     * // Delete one BattleProblem
     * const BattleProblem = await prisma.battleProblem.delete({
     *   where: {
     *     // ... filter to delete one BattleProblem
     *   }
     * })
     * 
     */
    delete<T extends BattleProblemDeleteArgs>(args: SelectSubset<T, BattleProblemDeleteArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one BattleProblem.
     * @param {BattleProblemUpdateArgs} args - Arguments to update one BattleProblem.
     * @example
     * // Update one BattleProblem
     * const battleProblem = await prisma.battleProblem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BattleProblemUpdateArgs>(args: SelectSubset<T, BattleProblemUpdateArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more BattleProblems.
     * @param {BattleProblemDeleteManyArgs} args - Arguments to filter BattleProblems to delete.
     * @example
     * // Delete a few BattleProblems
     * const { count } = await prisma.battleProblem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BattleProblemDeleteManyArgs>(args?: SelectSubset<T, BattleProblemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BattleProblems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BattleProblems
     * const battleProblem = await prisma.battleProblem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BattleProblemUpdateManyArgs>(args: SelectSubset<T, BattleProblemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BattleProblem.
     * @param {BattleProblemUpsertArgs} args - Arguments to update or create a BattleProblem.
     * @example
     * // Update or create a BattleProblem
     * const battleProblem = await prisma.battleProblem.upsert({
     *   create: {
     *     // ... data to create a BattleProblem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BattleProblem we want to update
     *   }
     * })
     */
    upsert<T extends BattleProblemUpsertArgs>(args: SelectSubset<T, BattleProblemUpsertArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of BattleProblems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemCountArgs} args - Arguments to filter BattleProblems to count.
     * @example
     * // Count the number of BattleProblems
     * const count = await prisma.battleProblem.count({
     *   where: {
     *     // ... the filter for the BattleProblems we want to count
     *   }
     * })
    **/
    count<T extends BattleProblemCountArgs>(
      args?: Subset<T, BattleProblemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BattleProblemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BattleProblem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BattleProblemAggregateArgs>(args: Subset<T, BattleProblemAggregateArgs>): Prisma.PrismaPromise<GetBattleProblemAggregateType<T>>

    /**
     * Group by BattleProblem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleProblemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BattleProblemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BattleProblemGroupByArgs['orderBy'] }
        : { orderBy?: BattleProblemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BattleProblemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBattleProblemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BattleProblem model
   */
  readonly fields: BattleProblemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BattleProblem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BattleProblemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    testCases<T extends BattleProblem$testCasesArgs<ExtArgs> = {}>(args?: Subset<T, BattleProblem$testCasesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BattleProblem model
   */ 
  interface BattleProblemFieldRefs {
    readonly id: FieldRef<"BattleProblem", 'String'>
    readonly title: FieldRef<"BattleProblem", 'String'>
    readonly slug: FieldRef<"BattleProblem", 'String'>
    readonly difficulty: FieldRef<"BattleProblem", 'String'>
    readonly statement: FieldRef<"BattleProblem", 'String'>
    readonly constraints: FieldRef<"BattleProblem", 'String'>
    readonly inputFormat: FieldRef<"BattleProblem", 'String'>
    readonly outputFormat: FieldRef<"BattleProblem", 'String'>
    readonly functionName: FieldRef<"BattleProblem", 'String'>
    readonly returnType: FieldRef<"BattleProblem", 'String'>
    readonly paramTypes: FieldRef<"BattleProblem", 'String[]'>
    readonly paramNames: FieldRef<"BattleProblem", 'String[]'>
    readonly starterCode: FieldRef<"BattleProblem", 'String'>
    readonly language: FieldRef<"BattleProblem", 'String'>
    readonly tags: FieldRef<"BattleProblem", 'String[]'>
    readonly category: FieldRef<"BattleProblem", 'String'>
    readonly isPublished: FieldRef<"BattleProblem", 'Boolean'>
    readonly createdAt: FieldRef<"BattleProblem", 'DateTime'>
    readonly updatedAt: FieldRef<"BattleProblem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BattleProblem findUnique
   */
  export type BattleProblemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * Filter, which BattleProblem to fetch.
     */
    where: BattleProblemWhereUniqueInput
  }

  /**
   * BattleProblem findUniqueOrThrow
   */
  export type BattleProblemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * Filter, which BattleProblem to fetch.
     */
    where: BattleProblemWhereUniqueInput
  }

  /**
   * BattleProblem findFirst
   */
  export type BattleProblemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * Filter, which BattleProblem to fetch.
     */
    where?: BattleProblemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleProblems to fetch.
     */
    orderBy?: BattleProblemOrderByWithRelationInput | BattleProblemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BattleProblems.
     */
    cursor?: BattleProblemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleProblems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleProblems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BattleProblems.
     */
    distinct?: BattleProblemScalarFieldEnum | BattleProblemScalarFieldEnum[]
  }

  /**
   * BattleProblem findFirstOrThrow
   */
  export type BattleProblemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * Filter, which BattleProblem to fetch.
     */
    where?: BattleProblemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleProblems to fetch.
     */
    orderBy?: BattleProblemOrderByWithRelationInput | BattleProblemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BattleProblems.
     */
    cursor?: BattleProblemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleProblems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleProblems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BattleProblems.
     */
    distinct?: BattleProblemScalarFieldEnum | BattleProblemScalarFieldEnum[]
  }

  /**
   * BattleProblem findMany
   */
  export type BattleProblemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * Filter, which BattleProblems to fetch.
     */
    where?: BattleProblemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleProblems to fetch.
     */
    orderBy?: BattleProblemOrderByWithRelationInput | BattleProblemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BattleProblems.
     */
    cursor?: BattleProblemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleProblems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleProblems.
     */
    skip?: number
    distinct?: BattleProblemScalarFieldEnum | BattleProblemScalarFieldEnum[]
  }

  /**
   * BattleProblem create
   */
  export type BattleProblemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * The data needed to create a BattleProblem.
     */
    data: XOR<BattleProblemCreateInput, BattleProblemUncheckedCreateInput>
  }

  /**
   * BattleProblem createMany
   */
  export type BattleProblemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BattleProblems.
     */
    data: BattleProblemCreateManyInput | BattleProblemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BattleProblem createManyAndReturn
   */
  export type BattleProblemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many BattleProblems.
     */
    data: BattleProblemCreateManyInput | BattleProblemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BattleProblem update
   */
  export type BattleProblemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * The data needed to update a BattleProblem.
     */
    data: XOR<BattleProblemUpdateInput, BattleProblemUncheckedUpdateInput>
    /**
     * Choose, which BattleProblem to update.
     */
    where: BattleProblemWhereUniqueInput
  }

  /**
   * BattleProblem updateMany
   */
  export type BattleProblemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BattleProblems.
     */
    data: XOR<BattleProblemUpdateManyMutationInput, BattleProblemUncheckedUpdateManyInput>
    /**
     * Filter which BattleProblems to update
     */
    where?: BattleProblemWhereInput
  }

  /**
   * BattleProblem upsert
   */
  export type BattleProblemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * The filter to search for the BattleProblem to update in case it exists.
     */
    where: BattleProblemWhereUniqueInput
    /**
     * In case the BattleProblem found by the `where` argument doesn't exist, create a new BattleProblem with this data.
     */
    create: XOR<BattleProblemCreateInput, BattleProblemUncheckedCreateInput>
    /**
     * In case the BattleProblem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BattleProblemUpdateInput, BattleProblemUncheckedUpdateInput>
  }

  /**
   * BattleProblem delete
   */
  export type BattleProblemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
    /**
     * Filter which BattleProblem to delete.
     */
    where: BattleProblemWhereUniqueInput
  }

  /**
   * BattleProblem deleteMany
   */
  export type BattleProblemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BattleProblems to delete
     */
    where?: BattleProblemWhereInput
  }

  /**
   * BattleProblem.testCases
   */
  export type BattleProblem$testCasesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    where?: BattleTestCaseWhereInput
    orderBy?: BattleTestCaseOrderByWithRelationInput | BattleTestCaseOrderByWithRelationInput[]
    cursor?: BattleTestCaseWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BattleTestCaseScalarFieldEnum | BattleTestCaseScalarFieldEnum[]
  }

  /**
   * BattleProblem without action
   */
  export type BattleProblemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleProblem
     */
    select?: BattleProblemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleProblemInclude<ExtArgs> | null
  }


  /**
   * Model BattleTestCase
   */

  export type AggregateBattleTestCase = {
    _count: BattleTestCaseCountAggregateOutputType | null
    _avg: BattleTestCaseAvgAggregateOutputType | null
    _sum: BattleTestCaseSumAggregateOutputType | null
    _min: BattleTestCaseMinAggregateOutputType | null
    _max: BattleTestCaseMaxAggregateOutputType | null
  }

  export type BattleTestCaseAvgAggregateOutputType = {
    order: number | null
    timeLimitMs: number | null
    memoryLimitMb: number | null
  }

  export type BattleTestCaseSumAggregateOutputType = {
    order: number | null
    timeLimitMs: number | null
    memoryLimitMb: number | null
  }

  export type BattleTestCaseMinAggregateOutputType = {
    id: string | null
    problemId: string | null
    isPublic: boolean | null
    order: number | null
    timeLimitMs: number | null
    memoryLimitMb: number | null
  }

  export type BattleTestCaseMaxAggregateOutputType = {
    id: string | null
    problemId: string | null
    isPublic: boolean | null
    order: number | null
    timeLimitMs: number | null
    memoryLimitMb: number | null
  }

  export type BattleTestCaseCountAggregateOutputType = {
    id: number
    problemId: number
    input: number
    expected: number
    isPublic: number
    order: number
    timeLimitMs: number
    memoryLimitMb: number
    _all: number
  }


  export type BattleTestCaseAvgAggregateInputType = {
    order?: true
    timeLimitMs?: true
    memoryLimitMb?: true
  }

  export type BattleTestCaseSumAggregateInputType = {
    order?: true
    timeLimitMs?: true
    memoryLimitMb?: true
  }

  export type BattleTestCaseMinAggregateInputType = {
    id?: true
    problemId?: true
    isPublic?: true
    order?: true
    timeLimitMs?: true
    memoryLimitMb?: true
  }

  export type BattleTestCaseMaxAggregateInputType = {
    id?: true
    problemId?: true
    isPublic?: true
    order?: true
    timeLimitMs?: true
    memoryLimitMb?: true
  }

  export type BattleTestCaseCountAggregateInputType = {
    id?: true
    problemId?: true
    input?: true
    expected?: true
    isPublic?: true
    order?: true
    timeLimitMs?: true
    memoryLimitMb?: true
    _all?: true
  }

  export type BattleTestCaseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BattleTestCase to aggregate.
     */
    where?: BattleTestCaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleTestCases to fetch.
     */
    orderBy?: BattleTestCaseOrderByWithRelationInput | BattleTestCaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BattleTestCaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleTestCases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleTestCases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BattleTestCases
    **/
    _count?: true | BattleTestCaseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BattleTestCaseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BattleTestCaseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BattleTestCaseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BattleTestCaseMaxAggregateInputType
  }

  export type GetBattleTestCaseAggregateType<T extends BattleTestCaseAggregateArgs> = {
        [P in keyof T & keyof AggregateBattleTestCase]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBattleTestCase[P]>
      : GetScalarType<T[P], AggregateBattleTestCase[P]>
  }




  export type BattleTestCaseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BattleTestCaseWhereInput
    orderBy?: BattleTestCaseOrderByWithAggregationInput | BattleTestCaseOrderByWithAggregationInput[]
    by: BattleTestCaseScalarFieldEnum[] | BattleTestCaseScalarFieldEnum
    having?: BattleTestCaseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BattleTestCaseCountAggregateInputType | true
    _avg?: BattleTestCaseAvgAggregateInputType
    _sum?: BattleTestCaseSumAggregateInputType
    _min?: BattleTestCaseMinAggregateInputType
    _max?: BattleTestCaseMaxAggregateInputType
  }

  export type BattleTestCaseGroupByOutputType = {
    id: string
    problemId: string
    input: JsonValue
    expected: JsonValue
    isPublic: boolean
    order: number
    timeLimitMs: number
    memoryLimitMb: number
    _count: BattleTestCaseCountAggregateOutputType | null
    _avg: BattleTestCaseAvgAggregateOutputType | null
    _sum: BattleTestCaseSumAggregateOutputType | null
    _min: BattleTestCaseMinAggregateOutputType | null
    _max: BattleTestCaseMaxAggregateOutputType | null
  }

  type GetBattleTestCaseGroupByPayload<T extends BattleTestCaseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BattleTestCaseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BattleTestCaseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BattleTestCaseGroupByOutputType[P]>
            : GetScalarType<T[P], BattleTestCaseGroupByOutputType[P]>
        }
      >
    >


  export type BattleTestCaseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    problemId?: boolean
    input?: boolean
    expected?: boolean
    isPublic?: boolean
    order?: boolean
    timeLimitMs?: boolean
    memoryLimitMb?: boolean
    problem?: boolean | BattleProblemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["battleTestCase"]>

  export type BattleTestCaseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    problemId?: boolean
    input?: boolean
    expected?: boolean
    isPublic?: boolean
    order?: boolean
    timeLimitMs?: boolean
    memoryLimitMb?: boolean
    problem?: boolean | BattleProblemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["battleTestCase"]>

  export type BattleTestCaseSelectScalar = {
    id?: boolean
    problemId?: boolean
    input?: boolean
    expected?: boolean
    isPublic?: boolean
    order?: boolean
    timeLimitMs?: boolean
    memoryLimitMb?: boolean
  }

  export type BattleTestCaseInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    problem?: boolean | BattleProblemDefaultArgs<ExtArgs>
  }
  export type BattleTestCaseIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    problem?: boolean | BattleProblemDefaultArgs<ExtArgs>
  }

  export type $BattleTestCasePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BattleTestCase"
    objects: {
      problem: Prisma.$BattleProblemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      problemId: string
      input: Prisma.JsonValue
      expected: Prisma.JsonValue
      isPublic: boolean
      order: number
      timeLimitMs: number
      memoryLimitMb: number
    }, ExtArgs["result"]["battleTestCase"]>
    composites: {}
  }

  type BattleTestCaseGetPayload<S extends boolean | null | undefined | BattleTestCaseDefaultArgs> = $Result.GetResult<Prisma.$BattleTestCasePayload, S>

  type BattleTestCaseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BattleTestCaseFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BattleTestCaseCountAggregateInputType | true
    }

  export interface BattleTestCaseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BattleTestCase'], meta: { name: 'BattleTestCase' } }
    /**
     * Find zero or one BattleTestCase that matches the filter.
     * @param {BattleTestCaseFindUniqueArgs} args - Arguments to find a BattleTestCase
     * @example
     * // Get one BattleTestCase
     * const battleTestCase = await prisma.battleTestCase.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BattleTestCaseFindUniqueArgs>(args: SelectSubset<T, BattleTestCaseFindUniqueArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one BattleTestCase that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BattleTestCaseFindUniqueOrThrowArgs} args - Arguments to find a BattleTestCase
     * @example
     * // Get one BattleTestCase
     * const battleTestCase = await prisma.battleTestCase.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BattleTestCaseFindUniqueOrThrowArgs>(args: SelectSubset<T, BattleTestCaseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first BattleTestCase that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseFindFirstArgs} args - Arguments to find a BattleTestCase
     * @example
     * // Get one BattleTestCase
     * const battleTestCase = await prisma.battleTestCase.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BattleTestCaseFindFirstArgs>(args?: SelectSubset<T, BattleTestCaseFindFirstArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first BattleTestCase that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseFindFirstOrThrowArgs} args - Arguments to find a BattleTestCase
     * @example
     * // Get one BattleTestCase
     * const battleTestCase = await prisma.battleTestCase.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BattleTestCaseFindFirstOrThrowArgs>(args?: SelectSubset<T, BattleTestCaseFindFirstOrThrowArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more BattleTestCases that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BattleTestCases
     * const battleTestCases = await prisma.battleTestCase.findMany()
     * 
     * // Get first 10 BattleTestCases
     * const battleTestCases = await prisma.battleTestCase.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const battleTestCaseWithIdOnly = await prisma.battleTestCase.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BattleTestCaseFindManyArgs>(args?: SelectSubset<T, BattleTestCaseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a BattleTestCase.
     * @param {BattleTestCaseCreateArgs} args - Arguments to create a BattleTestCase.
     * @example
     * // Create one BattleTestCase
     * const BattleTestCase = await prisma.battleTestCase.create({
     *   data: {
     *     // ... data to create a BattleTestCase
     *   }
     * })
     * 
     */
    create<T extends BattleTestCaseCreateArgs>(args: SelectSubset<T, BattleTestCaseCreateArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many BattleTestCases.
     * @param {BattleTestCaseCreateManyArgs} args - Arguments to create many BattleTestCases.
     * @example
     * // Create many BattleTestCases
     * const battleTestCase = await prisma.battleTestCase.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BattleTestCaseCreateManyArgs>(args?: SelectSubset<T, BattleTestCaseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BattleTestCases and returns the data saved in the database.
     * @param {BattleTestCaseCreateManyAndReturnArgs} args - Arguments to create many BattleTestCases.
     * @example
     * // Create many BattleTestCases
     * const battleTestCase = await prisma.battleTestCase.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BattleTestCases and only return the `id`
     * const battleTestCaseWithIdOnly = await prisma.battleTestCase.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BattleTestCaseCreateManyAndReturnArgs>(args?: SelectSubset<T, BattleTestCaseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a BattleTestCase.
     * @param {BattleTestCaseDeleteArgs} args - Arguments to delete one BattleTestCase.
     * @example
     * // Delete one BattleTestCase
     * const BattleTestCase = await prisma.battleTestCase.delete({
     *   where: {
     *     // ... filter to delete one BattleTestCase
     *   }
     * })
     * 
     */
    delete<T extends BattleTestCaseDeleteArgs>(args: SelectSubset<T, BattleTestCaseDeleteArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one BattleTestCase.
     * @param {BattleTestCaseUpdateArgs} args - Arguments to update one BattleTestCase.
     * @example
     * // Update one BattleTestCase
     * const battleTestCase = await prisma.battleTestCase.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BattleTestCaseUpdateArgs>(args: SelectSubset<T, BattleTestCaseUpdateArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more BattleTestCases.
     * @param {BattleTestCaseDeleteManyArgs} args - Arguments to filter BattleTestCases to delete.
     * @example
     * // Delete a few BattleTestCases
     * const { count } = await prisma.battleTestCase.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BattleTestCaseDeleteManyArgs>(args?: SelectSubset<T, BattleTestCaseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BattleTestCases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BattleTestCases
     * const battleTestCase = await prisma.battleTestCase.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BattleTestCaseUpdateManyArgs>(args: SelectSubset<T, BattleTestCaseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BattleTestCase.
     * @param {BattleTestCaseUpsertArgs} args - Arguments to update or create a BattleTestCase.
     * @example
     * // Update or create a BattleTestCase
     * const battleTestCase = await prisma.battleTestCase.upsert({
     *   create: {
     *     // ... data to create a BattleTestCase
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BattleTestCase we want to update
     *   }
     * })
     */
    upsert<T extends BattleTestCaseUpsertArgs>(args: SelectSubset<T, BattleTestCaseUpsertArgs<ExtArgs>>): Prisma__BattleTestCaseClient<$Result.GetResult<Prisma.$BattleTestCasePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of BattleTestCases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseCountArgs} args - Arguments to filter BattleTestCases to count.
     * @example
     * // Count the number of BattleTestCases
     * const count = await prisma.battleTestCase.count({
     *   where: {
     *     // ... the filter for the BattleTestCases we want to count
     *   }
     * })
    **/
    count<T extends BattleTestCaseCountArgs>(
      args?: Subset<T, BattleTestCaseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BattleTestCaseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BattleTestCase.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BattleTestCaseAggregateArgs>(args: Subset<T, BattleTestCaseAggregateArgs>): Prisma.PrismaPromise<GetBattleTestCaseAggregateType<T>>

    /**
     * Group by BattleTestCase.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BattleTestCaseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BattleTestCaseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BattleTestCaseGroupByArgs['orderBy'] }
        : { orderBy?: BattleTestCaseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BattleTestCaseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBattleTestCaseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BattleTestCase model
   */
  readonly fields: BattleTestCaseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BattleTestCase.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BattleTestCaseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    problem<T extends BattleProblemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BattleProblemDefaultArgs<ExtArgs>>): Prisma__BattleProblemClient<$Result.GetResult<Prisma.$BattleProblemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BattleTestCase model
   */ 
  interface BattleTestCaseFieldRefs {
    readonly id: FieldRef<"BattleTestCase", 'String'>
    readonly problemId: FieldRef<"BattleTestCase", 'String'>
    readonly input: FieldRef<"BattleTestCase", 'Json'>
    readonly expected: FieldRef<"BattleTestCase", 'Json'>
    readonly isPublic: FieldRef<"BattleTestCase", 'Boolean'>
    readonly order: FieldRef<"BattleTestCase", 'Int'>
    readonly timeLimitMs: FieldRef<"BattleTestCase", 'Int'>
    readonly memoryLimitMb: FieldRef<"BattleTestCase", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * BattleTestCase findUnique
   */
  export type BattleTestCaseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * Filter, which BattleTestCase to fetch.
     */
    where: BattleTestCaseWhereUniqueInput
  }

  /**
   * BattleTestCase findUniqueOrThrow
   */
  export type BattleTestCaseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * Filter, which BattleTestCase to fetch.
     */
    where: BattleTestCaseWhereUniqueInput
  }

  /**
   * BattleTestCase findFirst
   */
  export type BattleTestCaseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * Filter, which BattleTestCase to fetch.
     */
    where?: BattleTestCaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleTestCases to fetch.
     */
    orderBy?: BattleTestCaseOrderByWithRelationInput | BattleTestCaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BattleTestCases.
     */
    cursor?: BattleTestCaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleTestCases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleTestCases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BattleTestCases.
     */
    distinct?: BattleTestCaseScalarFieldEnum | BattleTestCaseScalarFieldEnum[]
  }

  /**
   * BattleTestCase findFirstOrThrow
   */
  export type BattleTestCaseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * Filter, which BattleTestCase to fetch.
     */
    where?: BattleTestCaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleTestCases to fetch.
     */
    orderBy?: BattleTestCaseOrderByWithRelationInput | BattleTestCaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BattleTestCases.
     */
    cursor?: BattleTestCaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleTestCases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleTestCases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BattleTestCases.
     */
    distinct?: BattleTestCaseScalarFieldEnum | BattleTestCaseScalarFieldEnum[]
  }

  /**
   * BattleTestCase findMany
   */
  export type BattleTestCaseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * Filter, which BattleTestCases to fetch.
     */
    where?: BattleTestCaseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BattleTestCases to fetch.
     */
    orderBy?: BattleTestCaseOrderByWithRelationInput | BattleTestCaseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BattleTestCases.
     */
    cursor?: BattleTestCaseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BattleTestCases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BattleTestCases.
     */
    skip?: number
    distinct?: BattleTestCaseScalarFieldEnum | BattleTestCaseScalarFieldEnum[]
  }

  /**
   * BattleTestCase create
   */
  export type BattleTestCaseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * The data needed to create a BattleTestCase.
     */
    data: XOR<BattleTestCaseCreateInput, BattleTestCaseUncheckedCreateInput>
  }

  /**
   * BattleTestCase createMany
   */
  export type BattleTestCaseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BattleTestCases.
     */
    data: BattleTestCaseCreateManyInput | BattleTestCaseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BattleTestCase createManyAndReturn
   */
  export type BattleTestCaseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many BattleTestCases.
     */
    data: BattleTestCaseCreateManyInput | BattleTestCaseCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BattleTestCase update
   */
  export type BattleTestCaseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * The data needed to update a BattleTestCase.
     */
    data: XOR<BattleTestCaseUpdateInput, BattleTestCaseUncheckedUpdateInput>
    /**
     * Choose, which BattleTestCase to update.
     */
    where: BattleTestCaseWhereUniqueInput
  }

  /**
   * BattleTestCase updateMany
   */
  export type BattleTestCaseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BattleTestCases.
     */
    data: XOR<BattleTestCaseUpdateManyMutationInput, BattleTestCaseUncheckedUpdateManyInput>
    /**
     * Filter which BattleTestCases to update
     */
    where?: BattleTestCaseWhereInput
  }

  /**
   * BattleTestCase upsert
   */
  export type BattleTestCaseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * The filter to search for the BattleTestCase to update in case it exists.
     */
    where: BattleTestCaseWhereUniqueInput
    /**
     * In case the BattleTestCase found by the `where` argument doesn't exist, create a new BattleTestCase with this data.
     */
    create: XOR<BattleTestCaseCreateInput, BattleTestCaseUncheckedCreateInput>
    /**
     * In case the BattleTestCase was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BattleTestCaseUpdateInput, BattleTestCaseUncheckedUpdateInput>
  }

  /**
   * BattleTestCase delete
   */
  export type BattleTestCaseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
    /**
     * Filter which BattleTestCase to delete.
     */
    where: BattleTestCaseWhereUniqueInput
  }

  /**
   * BattleTestCase deleteMany
   */
  export type BattleTestCaseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BattleTestCases to delete
     */
    where?: BattleTestCaseWhereInput
  }

  /**
   * BattleTestCase without action
   */
  export type BattleTestCaseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BattleTestCase
     */
    select?: BattleTestCaseSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BattleTestCaseInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const BattleProblemScalarFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    difficulty: 'difficulty',
    statement: 'statement',
    constraints: 'constraints',
    inputFormat: 'inputFormat',
    outputFormat: 'outputFormat',
    functionName: 'functionName',
    returnType: 'returnType',
    paramTypes: 'paramTypes',
    paramNames: 'paramNames',
    starterCode: 'starterCode',
    language: 'language',
    tags: 'tags',
    category: 'category',
    isPublished: 'isPublished',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BattleProblemScalarFieldEnum = (typeof BattleProblemScalarFieldEnum)[keyof typeof BattleProblemScalarFieldEnum]


  export const BattleTestCaseScalarFieldEnum: {
    id: 'id',
    problemId: 'problemId',
    input: 'input',
    expected: 'expected',
    isPublic: 'isPublic',
    order: 'order',
    timeLimitMs: 'timeLimitMs',
    memoryLimitMb: 'memoryLimitMb'
  };

  export type BattleTestCaseScalarFieldEnum = (typeof BattleTestCaseScalarFieldEnum)[keyof typeof BattleTestCaseScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type BattleProblemWhereInput = {
    AND?: BattleProblemWhereInput | BattleProblemWhereInput[]
    OR?: BattleProblemWhereInput[]
    NOT?: BattleProblemWhereInput | BattleProblemWhereInput[]
    id?: StringFilter<"BattleProblem"> | string
    title?: StringFilter<"BattleProblem"> | string
    slug?: StringFilter<"BattleProblem"> | string
    difficulty?: StringFilter<"BattleProblem"> | string
    statement?: StringFilter<"BattleProblem"> | string
    constraints?: StringNullableFilter<"BattleProblem"> | string | null
    inputFormat?: StringNullableFilter<"BattleProblem"> | string | null
    outputFormat?: StringNullableFilter<"BattleProblem"> | string | null
    functionName?: StringFilter<"BattleProblem"> | string
    returnType?: StringFilter<"BattleProblem"> | string
    paramTypes?: StringNullableListFilter<"BattleProblem">
    paramNames?: StringNullableListFilter<"BattleProblem">
    starterCode?: StringFilter<"BattleProblem"> | string
    language?: StringFilter<"BattleProblem"> | string
    tags?: StringNullableListFilter<"BattleProblem">
    category?: StringNullableFilter<"BattleProblem"> | string | null
    isPublished?: BoolFilter<"BattleProblem"> | boolean
    createdAt?: DateTimeFilter<"BattleProblem"> | Date | string
    updatedAt?: DateTimeFilter<"BattleProblem"> | Date | string
    testCases?: BattleTestCaseListRelationFilter
  }

  export type BattleProblemOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    difficulty?: SortOrder
    statement?: SortOrder
    constraints?: SortOrderInput | SortOrder
    inputFormat?: SortOrderInput | SortOrder
    outputFormat?: SortOrderInput | SortOrder
    functionName?: SortOrder
    returnType?: SortOrder
    paramTypes?: SortOrder
    paramNames?: SortOrder
    starterCode?: SortOrder
    language?: SortOrder
    tags?: SortOrder
    category?: SortOrderInput | SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    testCases?: BattleTestCaseOrderByRelationAggregateInput
  }

  export type BattleProblemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: BattleProblemWhereInput | BattleProblemWhereInput[]
    OR?: BattleProblemWhereInput[]
    NOT?: BattleProblemWhereInput | BattleProblemWhereInput[]
    title?: StringFilter<"BattleProblem"> | string
    difficulty?: StringFilter<"BattleProblem"> | string
    statement?: StringFilter<"BattleProblem"> | string
    constraints?: StringNullableFilter<"BattleProblem"> | string | null
    inputFormat?: StringNullableFilter<"BattleProblem"> | string | null
    outputFormat?: StringNullableFilter<"BattleProblem"> | string | null
    functionName?: StringFilter<"BattleProblem"> | string
    returnType?: StringFilter<"BattleProblem"> | string
    paramTypes?: StringNullableListFilter<"BattleProblem">
    paramNames?: StringNullableListFilter<"BattleProblem">
    starterCode?: StringFilter<"BattleProblem"> | string
    language?: StringFilter<"BattleProblem"> | string
    tags?: StringNullableListFilter<"BattleProblem">
    category?: StringNullableFilter<"BattleProblem"> | string | null
    isPublished?: BoolFilter<"BattleProblem"> | boolean
    createdAt?: DateTimeFilter<"BattleProblem"> | Date | string
    updatedAt?: DateTimeFilter<"BattleProblem"> | Date | string
    testCases?: BattleTestCaseListRelationFilter
  }, "id" | "slug">

  export type BattleProblemOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    difficulty?: SortOrder
    statement?: SortOrder
    constraints?: SortOrderInput | SortOrder
    inputFormat?: SortOrderInput | SortOrder
    outputFormat?: SortOrderInput | SortOrder
    functionName?: SortOrder
    returnType?: SortOrder
    paramTypes?: SortOrder
    paramNames?: SortOrder
    starterCode?: SortOrder
    language?: SortOrder
    tags?: SortOrder
    category?: SortOrderInput | SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BattleProblemCountOrderByAggregateInput
    _max?: BattleProblemMaxOrderByAggregateInput
    _min?: BattleProblemMinOrderByAggregateInput
  }

  export type BattleProblemScalarWhereWithAggregatesInput = {
    AND?: BattleProblemScalarWhereWithAggregatesInput | BattleProblemScalarWhereWithAggregatesInput[]
    OR?: BattleProblemScalarWhereWithAggregatesInput[]
    NOT?: BattleProblemScalarWhereWithAggregatesInput | BattleProblemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BattleProblem"> | string
    title?: StringWithAggregatesFilter<"BattleProblem"> | string
    slug?: StringWithAggregatesFilter<"BattleProblem"> | string
    difficulty?: StringWithAggregatesFilter<"BattleProblem"> | string
    statement?: StringWithAggregatesFilter<"BattleProblem"> | string
    constraints?: StringNullableWithAggregatesFilter<"BattleProblem"> | string | null
    inputFormat?: StringNullableWithAggregatesFilter<"BattleProblem"> | string | null
    outputFormat?: StringNullableWithAggregatesFilter<"BattleProblem"> | string | null
    functionName?: StringWithAggregatesFilter<"BattleProblem"> | string
    returnType?: StringWithAggregatesFilter<"BattleProblem"> | string
    paramTypes?: StringNullableListFilter<"BattleProblem">
    paramNames?: StringNullableListFilter<"BattleProblem">
    starterCode?: StringWithAggregatesFilter<"BattleProblem"> | string
    language?: StringWithAggregatesFilter<"BattleProblem"> | string
    tags?: StringNullableListFilter<"BattleProblem">
    category?: StringNullableWithAggregatesFilter<"BattleProblem"> | string | null
    isPublished?: BoolWithAggregatesFilter<"BattleProblem"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"BattleProblem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"BattleProblem"> | Date | string
  }

  export type BattleTestCaseWhereInput = {
    AND?: BattleTestCaseWhereInput | BattleTestCaseWhereInput[]
    OR?: BattleTestCaseWhereInput[]
    NOT?: BattleTestCaseWhereInput | BattleTestCaseWhereInput[]
    id?: StringFilter<"BattleTestCase"> | string
    problemId?: StringFilter<"BattleTestCase"> | string
    input?: JsonFilter<"BattleTestCase">
    expected?: JsonFilter<"BattleTestCase">
    isPublic?: BoolFilter<"BattleTestCase"> | boolean
    order?: IntFilter<"BattleTestCase"> | number
    timeLimitMs?: IntFilter<"BattleTestCase"> | number
    memoryLimitMb?: IntFilter<"BattleTestCase"> | number
    problem?: XOR<BattleProblemRelationFilter, BattleProblemWhereInput>
  }

  export type BattleTestCaseOrderByWithRelationInput = {
    id?: SortOrder
    problemId?: SortOrder
    input?: SortOrder
    expected?: SortOrder
    isPublic?: SortOrder
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
    problem?: BattleProblemOrderByWithRelationInput
  }

  export type BattleTestCaseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BattleTestCaseWhereInput | BattleTestCaseWhereInput[]
    OR?: BattleTestCaseWhereInput[]
    NOT?: BattleTestCaseWhereInput | BattleTestCaseWhereInput[]
    problemId?: StringFilter<"BattleTestCase"> | string
    input?: JsonFilter<"BattleTestCase">
    expected?: JsonFilter<"BattleTestCase">
    isPublic?: BoolFilter<"BattleTestCase"> | boolean
    order?: IntFilter<"BattleTestCase"> | number
    timeLimitMs?: IntFilter<"BattleTestCase"> | number
    memoryLimitMb?: IntFilter<"BattleTestCase"> | number
    problem?: XOR<BattleProblemRelationFilter, BattleProblemWhereInput>
  }, "id">

  export type BattleTestCaseOrderByWithAggregationInput = {
    id?: SortOrder
    problemId?: SortOrder
    input?: SortOrder
    expected?: SortOrder
    isPublic?: SortOrder
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
    _count?: BattleTestCaseCountOrderByAggregateInput
    _avg?: BattleTestCaseAvgOrderByAggregateInput
    _max?: BattleTestCaseMaxOrderByAggregateInput
    _min?: BattleTestCaseMinOrderByAggregateInput
    _sum?: BattleTestCaseSumOrderByAggregateInput
  }

  export type BattleTestCaseScalarWhereWithAggregatesInput = {
    AND?: BattleTestCaseScalarWhereWithAggregatesInput | BattleTestCaseScalarWhereWithAggregatesInput[]
    OR?: BattleTestCaseScalarWhereWithAggregatesInput[]
    NOT?: BattleTestCaseScalarWhereWithAggregatesInput | BattleTestCaseScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BattleTestCase"> | string
    problemId?: StringWithAggregatesFilter<"BattleTestCase"> | string
    input?: JsonWithAggregatesFilter<"BattleTestCase">
    expected?: JsonWithAggregatesFilter<"BattleTestCase">
    isPublic?: BoolWithAggregatesFilter<"BattleTestCase"> | boolean
    order?: IntWithAggregatesFilter<"BattleTestCase"> | number
    timeLimitMs?: IntWithAggregatesFilter<"BattleTestCase"> | number
    memoryLimitMb?: IntWithAggregatesFilter<"BattleTestCase"> | number
  }

  export type BattleProblemCreateInput = {
    id?: string
    title: string
    slug: string
    difficulty: string
    statement: string
    constraints?: string | null
    inputFormat?: string | null
    outputFormat?: string | null
    functionName: string
    returnType: string
    paramTypes?: BattleProblemCreateparamTypesInput | string[]
    paramNames?: BattleProblemCreateparamNamesInput | string[]
    starterCode: string
    language?: string
    tags?: BattleProblemCreatetagsInput | string[]
    category?: string | null
    isPublished?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    testCases?: BattleTestCaseCreateNestedManyWithoutProblemInput
  }

  export type BattleProblemUncheckedCreateInput = {
    id?: string
    title: string
    slug: string
    difficulty: string
    statement: string
    constraints?: string | null
    inputFormat?: string | null
    outputFormat?: string | null
    functionName: string
    returnType: string
    paramTypes?: BattleProblemCreateparamTypesInput | string[]
    paramNames?: BattleProblemCreateparamNamesInput | string[]
    starterCode: string
    language?: string
    tags?: BattleProblemCreatetagsInput | string[]
    category?: string | null
    isPublished?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    testCases?: BattleTestCaseUncheckedCreateNestedManyWithoutProblemInput
  }

  export type BattleProblemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    statement?: StringFieldUpdateOperationsInput | string
    constraints?: NullableStringFieldUpdateOperationsInput | string | null
    inputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    outputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    functionName?: StringFieldUpdateOperationsInput | string
    returnType?: StringFieldUpdateOperationsInput | string
    paramTypes?: BattleProblemUpdateparamTypesInput | string[]
    paramNames?: BattleProblemUpdateparamNamesInput | string[]
    starterCode?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    tags?: BattleProblemUpdatetagsInput | string[]
    category?: NullableStringFieldUpdateOperationsInput | string | null
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    testCases?: BattleTestCaseUpdateManyWithoutProblemNestedInput
  }

  export type BattleProblemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    statement?: StringFieldUpdateOperationsInput | string
    constraints?: NullableStringFieldUpdateOperationsInput | string | null
    inputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    outputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    functionName?: StringFieldUpdateOperationsInput | string
    returnType?: StringFieldUpdateOperationsInput | string
    paramTypes?: BattleProblemUpdateparamTypesInput | string[]
    paramNames?: BattleProblemUpdateparamNamesInput | string[]
    starterCode?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    tags?: BattleProblemUpdatetagsInput | string[]
    category?: NullableStringFieldUpdateOperationsInput | string | null
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    testCases?: BattleTestCaseUncheckedUpdateManyWithoutProblemNestedInput
  }

  export type BattleProblemCreateManyInput = {
    id?: string
    title: string
    slug: string
    difficulty: string
    statement: string
    constraints?: string | null
    inputFormat?: string | null
    outputFormat?: string | null
    functionName: string
    returnType: string
    paramTypes?: BattleProblemCreateparamTypesInput | string[]
    paramNames?: BattleProblemCreateparamNamesInput | string[]
    starterCode: string
    language?: string
    tags?: BattleProblemCreatetagsInput | string[]
    category?: string | null
    isPublished?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BattleProblemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    statement?: StringFieldUpdateOperationsInput | string
    constraints?: NullableStringFieldUpdateOperationsInput | string | null
    inputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    outputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    functionName?: StringFieldUpdateOperationsInput | string
    returnType?: StringFieldUpdateOperationsInput | string
    paramTypes?: BattleProblemUpdateparamTypesInput | string[]
    paramNames?: BattleProblemUpdateparamNamesInput | string[]
    starterCode?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    tags?: BattleProblemUpdatetagsInput | string[]
    category?: NullableStringFieldUpdateOperationsInput | string | null
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BattleProblemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    statement?: StringFieldUpdateOperationsInput | string
    constraints?: NullableStringFieldUpdateOperationsInput | string | null
    inputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    outputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    functionName?: StringFieldUpdateOperationsInput | string
    returnType?: StringFieldUpdateOperationsInput | string
    paramTypes?: BattleProblemUpdateparamTypesInput | string[]
    paramNames?: BattleProblemUpdateparamNamesInput | string[]
    starterCode?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    tags?: BattleProblemUpdatetagsInput | string[]
    category?: NullableStringFieldUpdateOperationsInput | string | null
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BattleTestCaseCreateInput = {
    id?: string
    input: JsonNullValueInput | InputJsonValue
    expected: JsonNullValueInput | InputJsonValue
    isPublic?: boolean
    order: number
    timeLimitMs?: number
    memoryLimitMb?: number
    problem: BattleProblemCreateNestedOneWithoutTestCasesInput
  }

  export type BattleTestCaseUncheckedCreateInput = {
    id?: string
    problemId: string
    input: JsonNullValueInput | InputJsonValue
    expected: JsonNullValueInput | InputJsonValue
    isPublic?: boolean
    order: number
    timeLimitMs?: number
    memoryLimitMb?: number
  }

  export type BattleTestCaseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
    problem?: BattleProblemUpdateOneRequiredWithoutTestCasesNestedInput
  }

  export type BattleTestCaseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    problemId?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
  }

  export type BattleTestCaseCreateManyInput = {
    id?: string
    problemId: string
    input: JsonNullValueInput | InputJsonValue
    expected: JsonNullValueInput | InputJsonValue
    isPublic?: boolean
    order: number
    timeLimitMs?: number
    memoryLimitMb?: number
  }

  export type BattleTestCaseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
  }

  export type BattleTestCaseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    problemId?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type BattleTestCaseListRelationFilter = {
    every?: BattleTestCaseWhereInput
    some?: BattleTestCaseWhereInput
    none?: BattleTestCaseWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type BattleTestCaseOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BattleProblemCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    difficulty?: SortOrder
    statement?: SortOrder
    constraints?: SortOrder
    inputFormat?: SortOrder
    outputFormat?: SortOrder
    functionName?: SortOrder
    returnType?: SortOrder
    paramTypes?: SortOrder
    paramNames?: SortOrder
    starterCode?: SortOrder
    language?: SortOrder
    tags?: SortOrder
    category?: SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BattleProblemMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    difficulty?: SortOrder
    statement?: SortOrder
    constraints?: SortOrder
    inputFormat?: SortOrder
    outputFormat?: SortOrder
    functionName?: SortOrder
    returnType?: SortOrder
    starterCode?: SortOrder
    language?: SortOrder
    category?: SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BattleProblemMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    difficulty?: SortOrder
    statement?: SortOrder
    constraints?: SortOrder
    inputFormat?: SortOrder
    outputFormat?: SortOrder
    functionName?: SortOrder
    returnType?: SortOrder
    starterCode?: SortOrder
    language?: SortOrder
    category?: SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BattleProblemRelationFilter = {
    is?: BattleProblemWhereInput
    isNot?: BattleProblemWhereInput
  }

  export type BattleTestCaseCountOrderByAggregateInput = {
    id?: SortOrder
    problemId?: SortOrder
    input?: SortOrder
    expected?: SortOrder
    isPublic?: SortOrder
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
  }

  export type BattleTestCaseAvgOrderByAggregateInput = {
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
  }

  export type BattleTestCaseMaxOrderByAggregateInput = {
    id?: SortOrder
    problemId?: SortOrder
    isPublic?: SortOrder
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
  }

  export type BattleTestCaseMinOrderByAggregateInput = {
    id?: SortOrder
    problemId?: SortOrder
    isPublic?: SortOrder
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
  }

  export type BattleTestCaseSumOrderByAggregateInput = {
    order?: SortOrder
    timeLimitMs?: SortOrder
    memoryLimitMb?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BattleProblemCreateparamTypesInput = {
    set: string[]
  }

  export type BattleProblemCreateparamNamesInput = {
    set: string[]
  }

  export type BattleProblemCreatetagsInput = {
    set: string[]
  }

  export type BattleTestCaseCreateNestedManyWithoutProblemInput = {
    create?: XOR<BattleTestCaseCreateWithoutProblemInput, BattleTestCaseUncheckedCreateWithoutProblemInput> | BattleTestCaseCreateWithoutProblemInput[] | BattleTestCaseUncheckedCreateWithoutProblemInput[]
    connectOrCreate?: BattleTestCaseCreateOrConnectWithoutProblemInput | BattleTestCaseCreateOrConnectWithoutProblemInput[]
    createMany?: BattleTestCaseCreateManyProblemInputEnvelope
    connect?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
  }

  export type BattleTestCaseUncheckedCreateNestedManyWithoutProblemInput = {
    create?: XOR<BattleTestCaseCreateWithoutProblemInput, BattleTestCaseUncheckedCreateWithoutProblemInput> | BattleTestCaseCreateWithoutProblemInput[] | BattleTestCaseUncheckedCreateWithoutProblemInput[]
    connectOrCreate?: BattleTestCaseCreateOrConnectWithoutProblemInput | BattleTestCaseCreateOrConnectWithoutProblemInput[]
    createMany?: BattleTestCaseCreateManyProblemInputEnvelope
    connect?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BattleProblemUpdateparamTypesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BattleProblemUpdateparamNamesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BattleProblemUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BattleTestCaseUpdateManyWithoutProblemNestedInput = {
    create?: XOR<BattleTestCaseCreateWithoutProblemInput, BattleTestCaseUncheckedCreateWithoutProblemInput> | BattleTestCaseCreateWithoutProblemInput[] | BattleTestCaseUncheckedCreateWithoutProblemInput[]
    connectOrCreate?: BattleTestCaseCreateOrConnectWithoutProblemInput | BattleTestCaseCreateOrConnectWithoutProblemInput[]
    upsert?: BattleTestCaseUpsertWithWhereUniqueWithoutProblemInput | BattleTestCaseUpsertWithWhereUniqueWithoutProblemInput[]
    createMany?: BattleTestCaseCreateManyProblemInputEnvelope
    set?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    disconnect?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    delete?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    connect?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    update?: BattleTestCaseUpdateWithWhereUniqueWithoutProblemInput | BattleTestCaseUpdateWithWhereUniqueWithoutProblemInput[]
    updateMany?: BattleTestCaseUpdateManyWithWhereWithoutProblemInput | BattleTestCaseUpdateManyWithWhereWithoutProblemInput[]
    deleteMany?: BattleTestCaseScalarWhereInput | BattleTestCaseScalarWhereInput[]
  }

  export type BattleTestCaseUncheckedUpdateManyWithoutProblemNestedInput = {
    create?: XOR<BattleTestCaseCreateWithoutProblemInput, BattleTestCaseUncheckedCreateWithoutProblemInput> | BattleTestCaseCreateWithoutProblemInput[] | BattleTestCaseUncheckedCreateWithoutProblemInput[]
    connectOrCreate?: BattleTestCaseCreateOrConnectWithoutProblemInput | BattleTestCaseCreateOrConnectWithoutProblemInput[]
    upsert?: BattleTestCaseUpsertWithWhereUniqueWithoutProblemInput | BattleTestCaseUpsertWithWhereUniqueWithoutProblemInput[]
    createMany?: BattleTestCaseCreateManyProblemInputEnvelope
    set?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    disconnect?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    delete?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    connect?: BattleTestCaseWhereUniqueInput | BattleTestCaseWhereUniqueInput[]
    update?: BattleTestCaseUpdateWithWhereUniqueWithoutProblemInput | BattleTestCaseUpdateWithWhereUniqueWithoutProblemInput[]
    updateMany?: BattleTestCaseUpdateManyWithWhereWithoutProblemInput | BattleTestCaseUpdateManyWithWhereWithoutProblemInput[]
    deleteMany?: BattleTestCaseScalarWhereInput | BattleTestCaseScalarWhereInput[]
  }

  export type BattleProblemCreateNestedOneWithoutTestCasesInput = {
    create?: XOR<BattleProblemCreateWithoutTestCasesInput, BattleProblemUncheckedCreateWithoutTestCasesInput>
    connectOrCreate?: BattleProblemCreateOrConnectWithoutTestCasesInput
    connect?: BattleProblemWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BattleProblemUpdateOneRequiredWithoutTestCasesNestedInput = {
    create?: XOR<BattleProblemCreateWithoutTestCasesInput, BattleProblemUncheckedCreateWithoutTestCasesInput>
    connectOrCreate?: BattleProblemCreateOrConnectWithoutTestCasesInput
    upsert?: BattleProblemUpsertWithoutTestCasesInput
    connect?: BattleProblemWhereUniqueInput
    update?: XOR<XOR<BattleProblemUpdateToOneWithWhereWithoutTestCasesInput, BattleProblemUpdateWithoutTestCasesInput>, BattleProblemUncheckedUpdateWithoutTestCasesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type BattleTestCaseCreateWithoutProblemInput = {
    id?: string
    input: JsonNullValueInput | InputJsonValue
    expected: JsonNullValueInput | InputJsonValue
    isPublic?: boolean
    order: number
    timeLimitMs?: number
    memoryLimitMb?: number
  }

  export type BattleTestCaseUncheckedCreateWithoutProblemInput = {
    id?: string
    input: JsonNullValueInput | InputJsonValue
    expected: JsonNullValueInput | InputJsonValue
    isPublic?: boolean
    order: number
    timeLimitMs?: number
    memoryLimitMb?: number
  }

  export type BattleTestCaseCreateOrConnectWithoutProblemInput = {
    where: BattleTestCaseWhereUniqueInput
    create: XOR<BattleTestCaseCreateWithoutProblemInput, BattleTestCaseUncheckedCreateWithoutProblemInput>
  }

  export type BattleTestCaseCreateManyProblemInputEnvelope = {
    data: BattleTestCaseCreateManyProblemInput | BattleTestCaseCreateManyProblemInput[]
    skipDuplicates?: boolean
  }

  export type BattleTestCaseUpsertWithWhereUniqueWithoutProblemInput = {
    where: BattleTestCaseWhereUniqueInput
    update: XOR<BattleTestCaseUpdateWithoutProblemInput, BattleTestCaseUncheckedUpdateWithoutProblemInput>
    create: XOR<BattleTestCaseCreateWithoutProblemInput, BattleTestCaseUncheckedCreateWithoutProblemInput>
  }

  export type BattleTestCaseUpdateWithWhereUniqueWithoutProblemInput = {
    where: BattleTestCaseWhereUniqueInput
    data: XOR<BattleTestCaseUpdateWithoutProblemInput, BattleTestCaseUncheckedUpdateWithoutProblemInput>
  }

  export type BattleTestCaseUpdateManyWithWhereWithoutProblemInput = {
    where: BattleTestCaseScalarWhereInput
    data: XOR<BattleTestCaseUpdateManyMutationInput, BattleTestCaseUncheckedUpdateManyWithoutProblemInput>
  }

  export type BattleTestCaseScalarWhereInput = {
    AND?: BattleTestCaseScalarWhereInput | BattleTestCaseScalarWhereInput[]
    OR?: BattleTestCaseScalarWhereInput[]
    NOT?: BattleTestCaseScalarWhereInput | BattleTestCaseScalarWhereInput[]
    id?: StringFilter<"BattleTestCase"> | string
    problemId?: StringFilter<"BattleTestCase"> | string
    input?: JsonFilter<"BattleTestCase">
    expected?: JsonFilter<"BattleTestCase">
    isPublic?: BoolFilter<"BattleTestCase"> | boolean
    order?: IntFilter<"BattleTestCase"> | number
    timeLimitMs?: IntFilter<"BattleTestCase"> | number
    memoryLimitMb?: IntFilter<"BattleTestCase"> | number
  }

  export type BattleProblemCreateWithoutTestCasesInput = {
    id?: string
    title: string
    slug: string
    difficulty: string
    statement: string
    constraints?: string | null
    inputFormat?: string | null
    outputFormat?: string | null
    functionName: string
    returnType: string
    paramTypes?: BattleProblemCreateparamTypesInput | string[]
    paramNames?: BattleProblemCreateparamNamesInput | string[]
    starterCode: string
    language?: string
    tags?: BattleProblemCreatetagsInput | string[]
    category?: string | null
    isPublished?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BattleProblemUncheckedCreateWithoutTestCasesInput = {
    id?: string
    title: string
    slug: string
    difficulty: string
    statement: string
    constraints?: string | null
    inputFormat?: string | null
    outputFormat?: string | null
    functionName: string
    returnType: string
    paramTypes?: BattleProblemCreateparamTypesInput | string[]
    paramNames?: BattleProblemCreateparamNamesInput | string[]
    starterCode: string
    language?: string
    tags?: BattleProblemCreatetagsInput | string[]
    category?: string | null
    isPublished?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BattleProblemCreateOrConnectWithoutTestCasesInput = {
    where: BattleProblemWhereUniqueInput
    create: XOR<BattleProblemCreateWithoutTestCasesInput, BattleProblemUncheckedCreateWithoutTestCasesInput>
  }

  export type BattleProblemUpsertWithoutTestCasesInput = {
    update: XOR<BattleProblemUpdateWithoutTestCasesInput, BattleProblemUncheckedUpdateWithoutTestCasesInput>
    create: XOR<BattleProblemCreateWithoutTestCasesInput, BattleProblemUncheckedCreateWithoutTestCasesInput>
    where?: BattleProblemWhereInput
  }

  export type BattleProblemUpdateToOneWithWhereWithoutTestCasesInput = {
    where?: BattleProblemWhereInput
    data: XOR<BattleProblemUpdateWithoutTestCasesInput, BattleProblemUncheckedUpdateWithoutTestCasesInput>
  }

  export type BattleProblemUpdateWithoutTestCasesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    statement?: StringFieldUpdateOperationsInput | string
    constraints?: NullableStringFieldUpdateOperationsInput | string | null
    inputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    outputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    functionName?: StringFieldUpdateOperationsInput | string
    returnType?: StringFieldUpdateOperationsInput | string
    paramTypes?: BattleProblemUpdateparamTypesInput | string[]
    paramNames?: BattleProblemUpdateparamNamesInput | string[]
    starterCode?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    tags?: BattleProblemUpdatetagsInput | string[]
    category?: NullableStringFieldUpdateOperationsInput | string | null
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BattleProblemUncheckedUpdateWithoutTestCasesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    difficulty?: StringFieldUpdateOperationsInput | string
    statement?: StringFieldUpdateOperationsInput | string
    constraints?: NullableStringFieldUpdateOperationsInput | string | null
    inputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    outputFormat?: NullableStringFieldUpdateOperationsInput | string | null
    functionName?: StringFieldUpdateOperationsInput | string
    returnType?: StringFieldUpdateOperationsInput | string
    paramTypes?: BattleProblemUpdateparamTypesInput | string[]
    paramNames?: BattleProblemUpdateparamNamesInput | string[]
    starterCode?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    tags?: BattleProblemUpdatetagsInput | string[]
    category?: NullableStringFieldUpdateOperationsInput | string | null
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BattleTestCaseCreateManyProblemInput = {
    id?: string
    input: JsonNullValueInput | InputJsonValue
    expected: JsonNullValueInput | InputJsonValue
    isPublic?: boolean
    order: number
    timeLimitMs?: number
    memoryLimitMb?: number
  }

  export type BattleTestCaseUpdateWithoutProblemInput = {
    id?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
  }

  export type BattleTestCaseUncheckedUpdateWithoutProblemInput = {
    id?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
  }

  export type BattleTestCaseUncheckedUpdateManyWithoutProblemInput = {
    id?: StringFieldUpdateOperationsInput | string
    input?: JsonNullValueInput | InputJsonValue
    expected?: JsonNullValueInput | InputJsonValue
    isPublic?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    timeLimitMs?: IntFieldUpdateOperationsInput | number
    memoryLimitMb?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use BattleProblemCountOutputTypeDefaultArgs instead
     */
    export type BattleProblemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BattleProblemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BattleProblemDefaultArgs instead
     */
    export type BattleProblemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BattleProblemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BattleTestCaseDefaultArgs instead
     */
    export type BattleTestCaseArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BattleTestCaseDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}