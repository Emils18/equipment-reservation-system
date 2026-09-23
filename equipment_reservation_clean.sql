-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: equipment_reservation
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `asset_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `condition_status` enum('good','damaged','maintenance') DEFAULT 'good',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_code` (`asset_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,'Epson Projector','Projector','PROJ-001','Main office projector','good',1,'2026-09-17 12:37:33','2026-09-22 16:25:52'),(3,'Charger','wires','CHarger-001','nice','good',1,'2026-09-22 16:29:18','2026-09-22 16:29:18'),(4,'11','tips','11',NULL,'good',1,'2026-09-22 17:19:41','2026-09-22 17:19:41');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_items`
--

DROP TABLE IF EXISTS `reservation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reservation_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `reservation_id` (`reservation_id`),
  KEY `idx_reservation_item` (`item_id`),
  CONSTRAINT `reservation_items_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservation_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_items`
--

LOCK TABLES `reservation_items` WRITE;
/*!40000 ALTER TABLE `reservation_items` DISABLE KEYS */;
INSERT INTO `reservation_items` VALUES (1,1,1,1),(2,2,1,1),(3,3,1,1),(4,4,1,1),(5,5,3,1);
/*!40000 ALTER TABLE `reservation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference_code` varchar(30) NOT NULL,
  `date_filed` date NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `purpose` text NOT NULL,
  `department` varchar(150) NOT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `requester_name` varchar(150) NOT NULL,
  `school_id` varchar(50) DEFAULT NULL,
  `instructor_name` varchar(150) DEFAULT NULL,
  `borrower_confirmed` tinyint(1) DEFAULT 0,
  `id_deposited` tinyint(1) NOT NULL DEFAULT 0,
  `id_deposited_at` datetime DEFAULT NULL,
  `id_returned` tinyint(1) NOT NULL DEFAULT 0,
  `id_returned_at` datetime DEFAULT NULL,
  `status` enum('pending','approved','finalized','released','returned','rejected','cancelled') DEFAULT 'pending',
  `staff_message` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `finalized_by` int(11) DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_code` (`reference_code`),
  KEY `approved_by` (`approved_by`),
  KEY `finalized_by` (`finalized_by`),
  KEY `idx_reservation_dates` (`start_date`,`end_date`),
  KEY `idx_reservation_status` (`status`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`finalized_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,'RES-2026-00001','2026-09-20','2026-09-24','2026-09-29','21:15:00','00:13:00','d','CMOB','w','w','dw','323232323','nn',1,0,NULL,0,NULL,'returned','Equipment has been returned successfully.',2,'2026-09-20 21:16:55',2,'2026-09-20 21:33:59','2026-09-20 21:34:12','2026-09-20 21:38:26','2026-09-20 13:14:15','2026-09-20 13:38:26'),(2,'RES-2026-00002','2026-09-20','2026-09-25','2026-09-30','21:42:00','21:41:00','ew','CMOB','ewe','ew','dwdd','232323','ew',1,0,NULL,0,NULL,'rejected','Your reservation request was not approved. Please contact the Computer Maintenance Office if you need assistance.',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-20 13:38:59','2026-09-20 13:39:15'),(3,'RES-2026-00003','2026-09-23','2026-09-29','2026-10-05','00:05:00','00:06:00','df','CMOB','d','c','dw','23232323','fdef',1,1,'2026-09-23 00:09:52',1,'2026-09-23 00:14:16','returned','Equipment has been returned and the School ID was returned to the borrower.',2,'2026-09-23 00:09:34',2,'2026-09-23 00:09:38','2026-09-23 00:09:57','2026-09-23 00:14:16','2026-09-22 16:05:07','2026-09-22 16:14:16'),(4,'RES-2026-00004','2026-09-23','2026-09-30','2026-10-01','01:14:00','00:17:00','ewewe','CMOB','cec','Lapu-Lapu City, Cebu, Central Visayas, PHL','dw','3232323','nn',1,1,'2026-09-23 00:15:28',0,NULL,'released','The equipment has been released. Your School ID will remain at the Repair Room until the equipment is returned.',2,'2026-09-23 00:15:20',2,'2026-09-23 00:15:25','2026-09-23 00:15:30',NULL,'2026-09-22 16:14:46','2026-09-22 16:15:30'),(5,'RES-2026-00005','2026-09-23','2026-09-26','2026-09-26','01:31:00','02:29:00','edsds','CMOB','cec','Lapu-Lapu City, Cebu, Central Visayas, PHL','dwdd','3232323','fdef',1,0,NULL,0,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-22 16:30:07','2026-09-22 16:30:07');
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'Emelio Mondares','123mon',1,'2026-09-17 18:46:12'),(2,'Emelio Mondares','Mondares123',1,'2026-09-20 13:07:31');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_history`
--

DROP TABLE IF EXISTS `status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reservation_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `reservation_id` (`reservation_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `status_history_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_history`
--

LOCK TABLES `status_history` WRITE;
/*!40000 ALTER TABLE `status_history` DISABLE KEYS */;
INSERT INTO `status_history` VALUES (1,1,'pending','Reservation submitted online by borrower.',NULL,'2026-09-20 13:14:15'),(2,1,'approved','Your reservation has been approved. Please proceed to the Repair Room to complete the physical form and required signatures.',2,'2026-09-20 13:16:55'),(3,1,'finalized',NULL,2,'2026-09-20 13:33:59'),(4,1,'released','ddd',2,'2026-09-20 13:34:12'),(5,1,'returned','Equipment has been returned successfully.',2,'2026-09-20 13:38:26'),(6,2,'pending','Reservation submitted online by borrower.',NULL,'2026-09-20 13:38:59'),(7,2,'rejected','Your reservation request was not approved. Please contact the Computer Maintenance Office if you need assistance.',2,'2026-09-20 13:39:15'),(8,3,'pending','Reservation submitted online by borrower.',NULL,'2026-09-22 16:05:07'),(9,3,'approved','Your reservation has been approved. Please proceed to the Repair Room to complete the physical form and required signatures.',2,'2026-09-22 16:09:34'),(10,3,'finalized',NULL,2,'2026-09-22 16:09:38'),(11,3,'released','Equipment has been released. Your School ID will remain at the office until the equipment is returned.',2,'2026-09-22 16:09:57'),(12,3,'returned','Equipment has been returned and the School ID was returned to the borrower.',2,'2026-09-22 16:14:16'),(13,4,'pending','Reservation submitted online by borrower.',NULL,'2026-09-22 16:14:46'),(14,4,'approved','Your reservation has been approved. Please proceed to the Repair Room, CMOB Department, to complete the physical form and required signatures.',2,'2026-09-22 16:15:20'),(15,4,'finalized','Your physical reservation form and required signatures have been completed. Please leave your School ID at the Repair Room before the equipment can be released.',2,'2026-09-22 16:15:25'),(16,4,'released','The equipment has been released. Your School ID will remain at the Repair Room until the equipment is returned.',2,'2026-09-22 16:15:30'),(17,5,'pending','Reservation submitted online by borrower.',NULL,'2026-09-22 16:30:07');
/*!40000 ALTER TABLE `status_history` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24  0:11:24

