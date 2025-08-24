-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 24/08/2025 às 23:27
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `finance_system`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `collaboratorId` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `parcelasTotal` int(11) DEFAULT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `status` enum('ativo','cancelado','quitado') DEFAULT 'ativo',
  `cancelledAt` datetime DEFAULT NULL,
  `userId` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `accounts`
--

INSERT INTO `accounts` (`id`, `collaboratorId`, `description`, `value`, `parcelasTotal`, `month`, `year`, `status`, `cancelledAt`, `userId`) VALUES
(36, 2, 'VIVO', 95.00, NULL, 8, 2025, 'ativo', NULL, 1),
(38, 2, 'Dédi', 205.00, NULL, 8, 2025, 'ativo', NULL, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `collaborators`
--

CREATE TABLE `collaborators` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `userId` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `collaborators`
--

INSERT INTO `collaborators` (`id`, `name`, `userId`) VALUES
(2, 'Gustavo', 1),
(5, 'tvbf', 3);

-- --------------------------------------------------------

--
-- Estrutura para tabela `shared_accounts`
--

CREATE TABLE `shared_accounts` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `sharedWithUserId` int(11) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `shared_accounts_tokens`
--

CREATE TABLE `shared_accounts_tokens` (
  `userId` int(11) NOT NULL,
  `token` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `shared_accounts_tokens`
--

INSERT INTO `shared_accounts_tokens` (`userId`, `token`) VALUES
(3, '7a23856d9a919af0c771107129c01f5bf2ff3a079f9dada8eaded291dbd285e5'),
(1, 'f6709f1f02da9f92fda96424f7dc96bce534c93256e212573e0c8c2cd9ff6734');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'Gustavo', '$2b$10$dHbjTxghYO9sIA1uH1zIueYy2raDIgzOirxBMBTiWlHxJUrZlM20q', 'admin'),
(3, 'teste', '$2b$10$ojFIqV3vdqW3mcmGW/Om1uQX/hEtzurDgl89Wr1EiI.3uWZARJbw6', 'user');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `collaboratorId` (`collaboratorId`);

--
-- Índices de tabela `collaborators`
--
ALTER TABLE `collaborators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Índices de tabela `shared_accounts`
--
ALTER TABLE `shared_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `sharedWithUserId` (`sharedWithUserId`);

--
-- Índices de tabela `shared_accounts_tokens`
--
ALTER TABLE `shared_accounts_tokens`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `token` (`token`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de tabela `collaborators`
--
ALTER TABLE `collaborators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `shared_accounts`
--
ALTER TABLE `shared_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`collaboratorId`) REFERENCES `collaborators` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `shared_accounts`
--
ALTER TABLE `shared_accounts`
  ADD CONSTRAINT `shared_accounts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `shared_accounts_ibfk_2` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `shared_accounts_tokens`
--
ALTER TABLE `shared_accounts_tokens`
  ADD CONSTRAINT `shared_accounts_tokens_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
