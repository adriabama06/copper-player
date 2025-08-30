# Copper Player Bot

A Minecraft bot designed to automate the collection of items from drop chests within a defined work area.

## Features

- **Drop Chest Detection**: Automatically detects and opens trapped chests in the specified work area. Like the copper golem uses copper chests
- **Item Collection**: Retrieves and organizes items from drop chests using itemframes.
- **Work Area Management**: Operates within a user-defined rectangular work area defined by two corner coordinates.

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- npm (Node Package Manager)
- A Minecraft server running on the specified IP and port.
- A Minecraft account (offline or premium) with access to the server.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/copper-player.git
   cd copper-player
   ```
   Or download here:
   ## [Download](https://github.com/adriabama06/copper-player/archive/refs/heads/main.zip)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your configuration:
     - `SERVER_IP`: The IP address of your Minecraft server.
     - `SERVER_PORT`: The port your server is running on (default: 25565).
     - `VERSION`: The Minecraft version (e.g., 1.21).
     - `AUTH`: Set to `offline` for offline mode or `microsoft` for a premium account.
     - `USERNAME`: Your Minecraft username.
     - `PASSWORD`: Your password (if using `microsoft` auth).
     - `WORK_AREA`: Define the work area using two corner coordinates in the format `X1,Y1,Z1|X2,Y2,Z2`.

### Usage

1. Start the bot:
   ```bash
   npm start
   ```

2. The bot will:
   - Connect to the specified Minecraft server.
   - Navigate to the defined work area.
   - Search for trapped chests within the area.
   - Open each trapped chest and collect all items.
   - Organize the collected items.

## Configuration

The bot uses environment variables defined in `.env`. Key settings:

- `SERVER_IP`: IP address of the Minecraft server.
- `SERVER_PORT`: Port the server is listening on.
- `VERSION`: Minecraft version to connect with.
- `AUTH`: Authentication method (`offline` or `microsoft`).
- `USERNAME`: Your Minecraft username.
- `PASSWORD`: Your password (required for `microsoft` auth).
- `WORK_AREA`: Two corner coordinates defining the rectangular work area (e.g., `100,64,100|110,70,110`).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For questions or issues, please open an issue in the repository.

## Thanks
Thanks to [mineflayer](https://github.com/PrismarineJS/mineflayer) for their amazing work.
