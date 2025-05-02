function Header() {
  return (
    <header>
	 	<h1 style={styles.title}>Order of Elites</h1>
		<nav style={styles.container}>
			<ul style={styles.menu}>
				<li style={styles.menuItem}>Home</li>
				<li style={styles.menuItem}>About</li>
				<li style={styles.menuItem}>Wiki</li>
				<li style={styles.menuItem}>Contact</li>
			</ul>
		</nav>
    </header>
  );
}

const styles = {
    title: {
		float: 'left',
		marginLeft: '50px'
    },
  	container: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		
  	},
  	menu: {
		display: 'flex',
		justifyContent: 'space-between',
		width: '60%',  // Adjust as needed
		listStyleType: 'none',
		padding: 0,
	},
	menuItem: {
   		margin: '0 10px',  // Add some spacing between menu items
  	}

}


export default Header;
