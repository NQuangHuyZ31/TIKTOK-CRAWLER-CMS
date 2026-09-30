from playwright.async_api import Page


# util funtions for browser interactions
async def open_url(
    page: Page,
    url: str,
    timeout: int = 7000,
    wait_time: int = 3000,
):
    try:
        await page.goto(
            url,
            wait_until="commit",
            timeout=timeout,
        )
    except Exception as error:
        print(f"Navigation warning: {error}")

    await page.wait_for_timeout(wait_time)


# util funtions for going back page
async def go_back(
    page: Page,
    timeout: int = 5000,
    wait_time: int = 3000,
):
    try:
        await page.go_back(
            wait_until="commit",
            timeout=timeout,
        )
    except Exception as error:
        print(f"go_back warning: {error}")

    await page.wait_for_timeout(wait_time)


# util funtions for scrolling page
async def scroll_page(
    page: Page,
    distance: int = 700,
    wait_time: int = 2500,
):
    print("Scrolling to next video...")

    await page.mouse.wheel(
        0,
        distance,
    )

    await page.wait_for_timeout(wait_time)