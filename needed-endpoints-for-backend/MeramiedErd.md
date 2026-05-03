# Meramied ERD

## Source Analysis

This ERD was derived from the backend endpoint documentation in `needed-endpoints-for-backend/`.

### What the docs imply
- `customer/` defines the storefront commerce flow: catalog, cart, checkout, recommendations, and ads.
- `store-owner/` defines store-scoped entities: products, categories, orders, accounting, warehouse, and settings.
- `back-office/` defines cross-platform operations: orders, drivers, notifications, and chat.
- `delivery-driver/` defines driver-scoped order lifecycle and proof-of-delivery.
- `marketer/` defines affiliate links, performance analytics, withdrawals, and payout settings.
- `admin/` defines platform users, platform settings, and admin account management.

### EF Core modeling assumptions
- Dashboard metrics are derived from persisted entities, not stored as separate tables.
- Names are bilingual in most entities: `NameEn` and `NameAr`.
- Collection-like DTO fields such as tags or repeated settings can be modeled as owned collections or separate tables in EF Core.
- Some back-office shapes are polymorphic in the docs. In the diagram below, they are represented with explicit scalar foreign-key fields where possible.

## ERD Notes
- `PlatformSetting` is a singleton table.
- `StoreSettings` and `MarketerSettings` are one-to-one extensions of the owning user/store.
- `DriverProfile` is a one-to-one extension of the delivery user.
- `ChatConversation` supports customer/store partners via `PartnerType` and `PartnerId`.
- `AffiliateLink` can target either a store or a product; in EF Core this can be mapped with optional FKs plus a check constraint.

## Mermaid ER Diagram

```mermaid
erDiagram
  APP_USER {
    string Id PK
    string NameEn
    string NameAr
    string Email
    string Role
    string Status
    date JoinedDate
    datetime CreatedAt
    datetime UpdatedAt
  }

  PLATFORM_SETTING {
    string Id PK
    string PlatformName
    string SupportEmail
    string DefaultCurrency
    decimal CommissionRate
    boolean MaintenanceMode
    datetime UpdatedAt
  }

  PLATFORM_CATEGORY {
    string Id PK
    string Code
    string NameAr
  }

  STORE {
    string Id PK
    string OwnerUserId FK
    string NameEn
    string NameAr
    string Emoji
    string DescriptionEn
    string DescriptionAr
    string CategoryCode FK
  }

  STORE_SETTINGS {
    string Id PK
    string StoreId FK
    string StoreNameEn
    string StoreNameAr
    string DescriptionEn
    string DescriptionAr
    string LogoUrl
    string CoverUrl
    string ContactEmail
    string Phone
    string Address
    decimal TaxRate
    string AcceptedCurrenciesJson
    string PaymentMethodsJson
    boolean NotifyNewOrder
    boolean NotifyLowStock
    int LowStockThreshold
    decimal DeliveryFee
    decimal FreeShippingThreshold
    int EstimatedDeliveryDays
    string OwnerNameEn
    string OwnerNameAr
    string OwnerEmail
    string OwnerPhone
    datetime UpdatedAt
  }

  STORE_CATEGORY {
    string Id PK
    string StoreId FK
    string NameEn
    string NameAr
    string Emoji
  }

  PRODUCT {
    string Id PK
    string StoreId FK
    string StoreCategoryId FK
    string CategoryCode FK
    string NameEn
    string NameAr
    string DescriptionEn
    string DescriptionAr
    decimal Price
    decimal OriginalPrice
    string ImageUrl
    decimal Rating
    int ReviewCount
    boolean IsNew
    boolean IsFeatured
  }

  PRODUCT_TAG {
    string Id PK
    string ProductId FK
    string Value
  }

  INVENTORY_ITEM {
    string ProductId PK, FK
    int Stock
    string Sku
  }

  STOCK_MOVEMENT {
    string Id PK
    string ProductId FK
    string SupplierId FK
    string Type
    int Quantity
    string Reason
    string ReasonAr
    date MovementDate
    string Reference
  }

  SUPPLIER {
    string Id PK
    string StoreId FK
    string NameEn
    string NameAr
    string ContactName
    string Phone
    string Email
    string Address
    int ProductsSupplied
  }

  CART {
    string Id PK
    string CustomerUserId FK
    datetime UpdatedAt
  }

  CART_ITEM {
    string CartId FK
    string ProductId FK
    int Quantity
  }

  ORDER {
    string Id PK
    string CustomerUserId FK
    string StoreId FK
    string AssignedDriverId FK
    string OrderNumber
    date OrderDate
    string Status
    string FullName
    string Phone
    string DeliveryAddress
    string PaymentMethod
    string Notes
    decimal Subtotal
    decimal DeliveryFee
    decimal Tax
    decimal Total
    string Currency
    int EstimatedDeliveryDays
    datetime CreatedAt
    string ProofOfDeliveryUrl
  }

  ORDER_ITEM {
    string Id PK
    string OrderId FK
    string ProductId FK
    string NameEn
    string NameAr
    int Qty
    decimal Price
  }

  INVOICE {
    string Id PK
    string StoreId FK
    string OrderId FK
    string InvoiceNumber
    string OrderNumber
    string CustomerNameEn
    string CustomerNameAr
    decimal Subtotal
    decimal Discount
    decimal Tax
    decimal Total
    string Currency
    date IssueDate
    string Status
  }

  EXPENSE {
    string Id PK
    string StoreId FK
    string TitleEn
    string TitleAr
    string Category
    decimal Amount
    string Currency
    date ExpenseDate
    string Note
  }

  DRIVER_PROFILE {
    string Id PK
    string UserId FK
    string Phone
    boolean Available
    string ActiveOrderId FK
  }

  AFFILIATE_LINK {
    string Id PK
    string MarketerUserId FK
    string StoreId FK
    string ProductId FK
    string Url
    string TargetNameEn
    string TargetNameAr
    string Type
    int Clicks
    int Conversions
    decimal Earned
    date CreatedAt
  }

  WITHDRAWAL_REQUEST {
    string Id PK
    string MarketerUserId FK
    decimal Amount
    string BankIban
    string WalletId
    string Status
    int EstimatedDays
    datetime CreatedAt
  }

  MARKETER_SETTINGS {
    string Id PK
    string UserId FK
    string PayoutMethod
    string BankIban
    string WalletId
    boolean NewConversion
    boolean PayoutProcessed
    boolean Promotions
  }

  CUSTOMER_INTEREST {
    string Id PK
    string CustomerUserId FK
    string CategoryCode FK
    datetime LastSeenAt
    int SortOrder
  }

  CHAT_CONVERSATION {
    string Id PK
    string BackOfficeUserId FK
    string Type
    string PartnerType
    string PartnerId
    string LastMessageEn
    string LastMessageAr
    datetime LastTimestamp
    int UnreadCount
  }

  CHAT_MESSAGE {
    string Id PK
    string ConversationId FK
    string SenderType
    string SenderId
    string Content
    datetime Timestamp
    boolean IsRead
  }

  NOTIFICATION {
    string Id PK
    string RecipientUserId FK
    string Type
    string TitleEn
    string TitleAr
    string BodyEn
    string BodyAr
    datetime Timestamp
    boolean IsRead
    string OrderId FK
    string ConversationId FK
  }

  APP_USER ||--o| CART : owns
  CART ||--o{ CART_ITEM : contains
  PRODUCT ||--o{ CART_ITEM : selected_in

  APP_USER ||--o{ ORDER : places
  STORE ||--o{ ORDER : receives
  DRIVER_PROFILE ||--o{ ORDER : assigned_to
  ORDER ||--o{ ORDER_ITEM : includes
  PRODUCT ||--o{ ORDER_ITEM : sold_as

  APP_USER ||--o| DRIVER_PROFILE : has
  APP_USER ||--o{ STORE : owns
  PLATFORM_CATEGORY ||--o{ STORE : classifies
  PLATFORM_CATEGORY ||--o{ PRODUCT : classifies
  STORE ||--o{ STORE_CATEGORY : defines
  STORE ||--o{ PRODUCT : lists
  STORE_CATEGORY ||--o{ PRODUCT : groups
  PRODUCT ||--o| INVENTORY_ITEM : stocked_as
  PRODUCT ||--o{ PRODUCT_TAG : tagged_with
  PRODUCT ||--o{ STOCK_MOVEMENT : movement_for
  SUPPLIER ||--o{ STOCK_MOVEMENT : source
  STORE ||--o{ SUPPLIER : manages
  STORE ||--o{ STORE_SETTINGS : configures
  STORE ||--o{ INVOICE : issues
  ORDER ||--o| INVOICE : billed_by
  STORE ||--o{ EXPENSE : records

  APP_USER ||--o{ AFFILIATE_LINK : owns
  STORE ||--o{ AFFILIATE_LINK : target_store
  PRODUCT ||--o{ AFFILIATE_LINK : target_product
  APP_USER ||--o{ WITHDRAWAL_REQUEST : requests
  APP_USER ||--o| MARKETER_SETTINGS : configures

  APP_USER ||--o{ CUSTOMER_INTEREST : tracks
  PLATFORM_CATEGORY ||--o{ CUSTOMER_INTEREST : referenced_by

  APP_USER ||--o{ CHAT_CONVERSATION : handles
  CHAT_CONVERSATION ||--o{ CHAT_MESSAGE : has

  APP_USER ||--o{ NOTIFICATION : receives
  ORDER ||--o{ NOTIFICATION : relates_to
  CHAT_CONVERSATION ||--o{ NOTIFICATION : relates_to
```

## Suggested EF Core entities
- `AppUser`
- `PlatformSetting`
- `PlatformCategory`
- `Store`
- `StoreSettings`
- `StoreCategory`
- `Product`
- `ProductTag`
- `InventoryItem`
- `StockMovement`
- `Supplier`
- `Cart`
- `CartItem`
- `Order`
- `OrderItem`
- `Invoice`
- `Expense`
- `DriverProfile`
- `AffiliateLink`
- `WithdrawalRequest`
- `MarketerSettings`
- `CustomerInterest`
- `ChatConversation`
- `ChatMessage`
- `Notification`

## Implementation note for EF Core
If you want, the next step can be turning this ERD into:
- C# entity classes
- `DbContext` configuration
- Fluent API relationships and constraints
- migration-ready EF Core mapping
