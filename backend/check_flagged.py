import asyncio
import os
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

async def check_flagged():
    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    async with driver.session() as session:
        print("Checking for flagged nodes...")
        res = await session.run("MATCH (n) WHERE n.curation_status = 'flagged' RETURN n, elementId(n) AS id")
        async for record in res:
            print(f"Node ID: {record['id']}")
            print(f"Node: {record['n']}")
        
        print("\nChecking for all nodes with curation_status property...")
        res2 = await session.run("MATCH (n) WHERE n.curation_status IS NOT NULL RETURN n.curation_status AS status, elementId(n) AS id")
        async for record in res2:
            print(f"Node ID: {record['id']} - Status: {record['status']}")

    await driver.close()

if __name__ == "__main__":
    asyncio.run(check_flagged())
