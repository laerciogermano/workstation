Page image: https://1to100.com/wp-content/uploads/2025/04/one-to-one-hundred-cover.jpg

Database Conventions | One to One Hundred

# Database Conventions

Baseplate uses Supabase as a backend. Supabase, in turn, is based on PostgreSQL and is built to allow for rapid development and deployment of backends more or less directly on top of the database. Good database naming paradigms and usage conventions ensure we get good security, good readability and above all clarity in the data model. In this document, we establish a clear set of database conventions for our work with Supabase and PostgreSQL. Our goal is to ensure consistency, clarity, and readability across all projects built on Baseplate to allow maximum speed to market and code reusability. We define standardized approaches for tables and column naming, primary and foreign keys, out of the box indexes, and row-level security policies.

## Table and Column Naming

Tables should be named using plural, lowercase nouns, separated by underscores. For example, users, products, or order_items. This pluralization reflects that a table holds multiple records. In the rare case you have a singleton table, yes, it should be named in the singular.

Columns are named using singular, lowercase nouns separated by underscores - generally referred to as snake_case. For example, a users table might have columns like first_name, last_name, and email.

## Primary and Foreign Keys

Primary keys should be named using the singular form of the table name followed by _id. For instance, the primary key for the users table would be user_id, and for the products table, it would be product_id. Note: This is NOT the default in the Supabase Table Editor UI which defaults to having the primary key for the table simply be id. Our experience is that if you just use " id" you’ll end up quickly having fifty table that all have the exact same primary key name and joins between tables quickly become confusing. (What id does this reference?) The goal of this convention is to make it immediately clear that the column is a primary key for a specific table and what table it belongs to.

Foreign keys, use the same convention: the singular name of the referenced table followed by _id. For example, in an orders table, the foreign key referencing the users table should be named user_id. This consistency simplifies joins and makes relationships between tables more obvious.

## Enums v. Option Tables

When a field in a table has a set number of options that can be selected (single or multiselect) you've got two options for modeling it in the database:

- PostgreSQL native ENUM type 

- You define a type like CREATE TYPE my_type AS ENUM ('opt1', 'opt2', 'opt3') and then in your table you use option my_type NOT NULL.
- The set of valid values is encoded in the database schema itself (the type definition).
- You'll have tight type checking that can be easily translated into your code
- Options (associative) table 

- You have a table (my_type) with rows like (id, programmatic_name, display_name, description and potentially some metadata).
- Your main table references this by a foreign key (e.g., my_type_id → my_type.my_type_id)

For multi-tenant SaaS here's how we decide which to use:

- When to use ENUM 

- The values are rare to change
- You don't need multi-language support
- Ordering is set and will not change
- Tenants cannot modify the values

```
In all other cases we recommend you use a lookup table and make this your default approach.  In that scenario here's roughly what that table will look like:-- Option set table definitionCREATE TABLE option_name_singelton (  option_set_id uuid NOT NULL DEFAULT gen_random_uuid(),  programmatic_name text NOT NULL,  display_name text NOT NULL,  description text,  sort_order integer NOT NULL DEFAULT 0,  is_active boolean NOT NULL DEFAULT true,  created_at timestamptz NOT NULL DEFAULT now(),  updated_at timestamptz NOT NULL DEFAULT now(),  PRIMARY KEY (option_set_id),  UNIQUE (programmatic_name));
```

You'll note in this case that we postpend the word "singelton" to the table to label it as a system wide type table. If it's a table that can be edited by a customer you'll need to add a customer_id foreign key reference to customers.customer_id and then add the relevant RLS to only allow customers to insert values with a customer_id match.

### Index and Constraint Naming

A good naming convention for indexes and constraints should prevent naming conflicts and make it easy to identify their purpose.

- Indexes - Use the format index_table_name_column_name. For example, an index on the email column of the users table could be index_users_email. For multi-column indexes, the default is to list all columns: index_orders_customer_id_order_date. That can lead to some long index names so use your judgement if a functional name is better (index_order_customer_order_date_mapping).
- Unique Constraints: Prefixed with unique. A unique constraint on the email column in the users table could be unique_users_email.
- Foreign Key Constraints: Use the format foreign_key_table_name_foreign_table_name_ column_name. For instance, a foreign key in the orders table referencing the users table could be named foreign_key_orders_users_user_id.
- Check Constraints: Prefix these with check. A constraint ensuring a price is positive could be check_products_price_is_positive. In general we recommend naming it on the thing you want to guarantee (that the price is positive) versus the thing you're checking (the price is not negative).

### Data Types and Case Sensitivity

PostgreSQL is case-sensitive when it comes to identifiers unless you enclose them in double quotes. To avoid issues, always use lowercase for all names. This aligns with standard SQL practices and makes your schema more portable and less error-prone.

For example, CREATE TABLE Users (id INT) is not the same as CREATE TABLE users (id INT) in all contexts, but using lowercase users is universally compatible and less ambiguous.

## Using uuid for primary keys

A UUID is a Universally Unique Identifier. It's a 128-bit value used to uniquely identify information across systems without significant risk of duplication. It’s often represented as a 36-character string in the format 8-4-4-4-12 (for example: 550e8400-e29b-41d4-a716-446655440000). UUIDs are widely used in databases and distributed systems because:

- They can be generated independently on different machines without coordination.
- The probability of two UUIDs colliding is astronomically low.
- They avoid sequential patterns like auto-increment IDs, which can leak system details or be predictable.

We recommend using UUIDs for all primary keys as they are more secure than sequential IDs, well in distributed environments and integrate with functions like gen_random_uuid(). UUIDs also integrate well with Supabase and other systems. For example, the SQL function auth.uid() in Supabase will return the UUID of the current, authenticated user. So we strongly prefer to have a unified system that aligns with Supabase.

## Supabase Specific Items

Supabase is a "Postgres-first" platform, so the general PostgreSQL naming conventions (lowercase, snake_case) are the foundation. However, there are a few Supabase-specific considerations.

- Tables, Columns, and Functions: Consistent with our naming convention Supabase recommends sticking to snake_case (e.g., user_profiles, posts). Supabase, like PostgreSQL, will automatically treat unquoted identifiers as lowercase. If you use camelCase or PascalCase, you will have to double-quote the names in every SQL query, which is a major pain in the ass and a source of errors.
- Primary Keys: As with standard Postgres, use table_name_id (e.g., user_id, post_id). Supabase often defaults to UUIDs for primary keys in new tables created via the dashboard, which is a good practice for distributed systems and client-side key generation.
- Foreign Keys: Follow the referenced_table_name_id pattern. For example, a foreign key in the posts table pointing to the users table should be named user_id.

## Row Level Security (RLS) and Policy Naming

RLS is the fundamental building block of security in Supabase. RLS allows you to write a series of policies for each table that define which rows of a table a given user, role or customer is allowed to access or modify. Policies are filters that are automatically applied to every query, ensuring that users only see or manipulate the rows they are authorized to. This allows for very fine grained security at the database level and, in our opinion, allows for data security to be handled at the source of the data.

A common example: a policy to only allow users to SELECT only the rows where the user_id column matches their own authenticated ID or where the user_role is a restricted System Standard Role (System Administrator, Customer Success, Customer Admin). RLS allows fine-grained, per-user, per-role and per-customer access control that is dynamic and secure, protecting sensitive data without requiring complex application-side logic.

Supabase provides helper functions in the database that allow you to build your RLS policies. The ones you’ll use all the time are:

- auth.uid() which returns the supabase UUID of the currently authenticated user. When using this, your policies often look like auth.uid() = users.auth_user_id. This is a supabase native function.
- current_user_id() - Helper function defined by Baseplate that is used to return the current user_id. This will be installed as part of your initial Baseplate setup and is provided below for reference. Note this returns the Baseplate user_id which is mapped to the Supabase auth_user_id but is distinct from it.
- customer_id() - Helper function defined by Baseplate that is used to return the current customer_id. This will be installed as part of your initial Baseplate setup and is provided below for reference.
- role_id() a PostgreSQL helper function defined by Baseplate that is used to return the current user’s role_id. This will be installed as part of your initial Baseplate setup and is provided below for reference.
- is_manager() - Check if user is manager
- get_user_roles() - Get user's roles
- is_system_role() - Returns true if the currently authenticated user has a system role
- is_system_admin() - Returns true if the currently authenticated user is a system administrator
- is_customer_success() - Returns true if the currently authenticated user is a customer success 
- is_customer_admin() - Returns true if the currently authenticated user has the customer_admin role
- can_access_customer(target_customer_id uuid) - Returns true if the currently authenticated user can access the specified customer (system admin, assigned customer success rep, or member of the customer)
- has_permission(permission_name) - Check that the current user has the named permission
- has_role(role_name) - Check the current has has the given named role
- has_system_role(role_name) - Check that the given role name is a system role
- get_accessible_customer_ids() - Get a list of customer IDs this user can access
- user_belongs_to_customer(customer_id) - Check customer membership
- get_current_user() - Get full user record
- has_any_permission(permissions[]) - Check any permission
- has_all_permissions(permissions[]) - Check all permissions
- get_customer_owner_id(customer_id) - Get customer owner
- is_customer_owner() - Check if user is customer owner

Naming conventions for RLS policies are:

- Policies: Use a clear and descriptive name for your RLS policies. A good convention is policy_action_name, such as: 

- policy_select_only_own_posts
- policy_insert_authenticated_user
- policy_update_own_profile
- This convention immediately tells you what the policy does and which action (SELECT, INSERT, UPDATE, DELETE) it applies to.
- Column Naming for RLS: Making RLS policies intuitive and readable is one of the key reasons we recommend primary keys and relevant foreign key columns be named using the full table name (e.g. user_id versus just “id”). This lets your write a policy like SELECT USING (current_customer_id() = customer_id) which is extremely easy to understand and portable across tables. Contrast that with SELECT USING (current_customer_id() = id) which works on the customer table but not other tables. 

We recommend you require RLS for all tables in your schema. If a table truly holds non-sensitive public data then you can simply write a RLS policy that allows everyone to access it. Note that by default, RLS is disabled in Supabase, so remember to toggle it on in the UI or via your SQL setup statement using ALTER TABLE table_name ENABLE ROW LEVEL SECURITY. That noted, Supabase will happily give you errors on all the tables that don’t have RLS is enabled so you’ll likely want to turn it on just to keep it from complaining.

Note that we only use Supabase's built-in roles (anon, authenticated, service_role) to define broad levels of access to the system. In practice we use the entries in the roles table to govern who gets access to what based on role base permissions.

Finally, while you can write complex queries within RLS policies you may take a hit on performance. An RLS policy acts as a WHERE clause on every query. A policy that includes a subquery or JOIN on a large table can significantly slow down your application. When possible, keep policies simple and rely on well-indexed columns like user_id. For complex logic, you may need to use a SECURITY DEFINER function to encapsulate the logic and bypass RLS on a specific query, while still ensuring the security checks are performed within the function.

## Managing User and Customer Data

Baseplate apps use Supabase Auth strictly for identity (email, password/OAuth, login metadata) and store all additional user and customer data in our own schema. Auth is narrowly focused on proving who the user is. Our database, then, defines all the additional information that the user can access in the (profile fields, roles, customer membership).

Here’s how an snippet of how the users table is setup:

> create table public.users (
> 
> /* Create an application specific UUID that is deleted when the user is deleted in the auth table */
> 
> user_id uuid primary key references auth.users(id) on delete cascade,
> 
> /* Example of the default fields in our standard users table */
> 
> email text,
> 
> firstname text,
> 
> Lastname text,
> 
> avatar_url text,
> 
> customer_id uuid, -- FK to customer table
> 
> role_id uuid, -- FK to roles table
> 
> creso_id uuid, -- link to Creso.ai master person for /* More Baseplate fields go here */
> 
> );
> 
> /* We then create an index on the common joins for lookup speed */
> 
> create index idx_users_default_customer_id on public.users(default_customer_id);
> 
> create index idx_users_creso_id on public.users(creso_id);
> 
> Finally, we’ll create the local rows automatically once a user is authenticated to avoid weird race conditions:
> 
> create or replace function public.handle_new_auth_user()
> 
> returns trigger language plpgsql security definer as $$
> 
> begin
> 
> insert into public.users(user_id) values (new.id) on conflict do nothing;
> 
> return new;
> 
> end $$;
> 
> create trigger on_auth_user_created
> 
> after insert on auth.users
> 
> for each row execute procedure public.handle_new_auth_user();

We then have similar setups for the customer table and roles tables to allow for mapping and speedy return of our PostgreSQL helper functions.

For apps built on Baseplate we recommend building associative tables for additional, app specific user information versus modifying the users table directly. This ensures that as new editions of baseplate are shipped you don’t impact them.

### Use Creso.ai For Enriched Data

Whenever we can, we’ll automatically link a user and customer to a Creso.ai record. This is a master record for that person (user) or company (customer) that provides enriched information on that. As much as you can *don’t* store this data in your app and pull the live records when and as needed from Creso. The reason for this: Creso is constantly enriching the data on your users and customers. If you store that data locally you run the risk of displaying stale data versus the guaranteed, current data from Creso. Treat Creso as your “source of truth” for enriched data on users and customers and pull that data live as needed. 

If you do need to store the data from Creso in your app we recommend you do it with an associative table (i.e. don’t edit the users table directly) and implement a basic sync pattern for the relevant fields using Edge Functions.

### Default users table policies

alter table public.users enable row level security;

/* Work up from the most restrictive to least restrictive role base policies */

/* Users can get and update their own data*/

create policy policy_select_own_user

on public.users for select

using (auth.uid() = user_id);

create policy policy_update_own_user

on public.users for update

using (auth.uid() = user_id);

/* Customer admin can get their customer’s users */

/* Customer success reps can get mapped users */

/* System admins can get anything */

### Tenant isolation example:

/* Consider the example of a table called invoices that is keyed like this (customer_id uuid, ...) */

alter table public.invoices enable row level security;

/** Members of the tenant can read all invoices */

create policy policy_invoices_tenant_read

on public.invoices for select

using (customer_id = current_customer_id());

## Roles & Permissions

Use Supabase built-in roles (anon, authenticated, service_role) only for coarse gating; rely on DB roles/claims + RLS for business authorization.

## Appendix - Database Setup Scripts

### Define customer_id() Postgres helper function

//What it should be with uuid

create or replace function public.customer_id()

returns uuid

language sql stable security definer set search_path = public as $$

 select p.customer_id

 from public.profiles p

 where p.user_id = auth.uid()

$$;

//What it currently is

create or replace function public.customer_id()

returns int

language sql stable security definer set search_path = public as $$

 select u.customer_id

 from public.users u

 where u.uid = CAST(auth.uid() AS text)

## Define the role_id() Postgres helper function

-- Example schema assumptions:

-- 1. A mapping table that stores system roles directly:

-- system_roles(user_id uuid primary key, role_id int)

-- where role_id is a single-digit enum (e.g., 1 = anon, 2 = authenticated, etc.)

-- 2. A standard roles table for custom roles:

-- roles(id uuid primary key, name text)

-- profiles(user_id uuid primary key, role_id uuid references roles(id))

create or replace function public.customer_id()

returns uuid

language sql stable security definer set search_path = public as $$

 select p.customer_id

 from public.profiles p

 where p.user_id = auth.uid()

$$;

create or replace function public.role_id()

returns text

language plpgsql

stable

security definer

set search_path = public as $$

declare

 sys_role int;

 custom_role uuid;

 -- First check if the user has a reserved system role

 select sr.role_id

 into sys_role

 from public.system_roles sr

 where sr.user_id = auth.uid();

 if found then

 return sys_role::text; -- return as text for uniformity

 end if;

 -- Otherwise check for a custom role in the roles table

 select p.role_id

 into custom_role

 from public.profiles p

 where p.user_id = auth.uid();

 if found then

 return custom_role::text;

 end if;

 -- If no role found, return NULL or a default

 return null;

## Define the updated_at function which automatically sets the updated_at value for the given row that’s update. Relevant to all tables that have updated_at timestamps.

-- Trigger to auto-update updated_at

create or replace function public.set_updated_at()

returns trigger

language plpgsql

as $$

 new.updated_at := now();

 return new;